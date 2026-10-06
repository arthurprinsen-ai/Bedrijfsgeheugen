CREATE OR REPLACE FUNCTION public.powerhouse_jsonb_object_v1(p_value jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_type text;
  v_parsed jsonb;
  v_item jsonb;
  v_result jsonb := '{}'::jsonb;
  v_non_numeric boolean := false;
begin
  if p_value is null then return '{}'::jsonb; end if;
  v_type := jsonb_typeof(p_value);

  if v_type='object' then
    select exists(
      select 1 from jsonb_object_keys(p_value) k where k !~ '^[0-9]+$'
    ) into v_non_numeric;
    if v_non_numeric or p_value='{}'::jsonb then return p_value; end if;
    return '{}'::jsonb;
  end if;

  if v_type='string' then
    begin
      v_parsed := (p_value #>> '{}')::jsonb;
    exception when others then
      return '{}'::jsonb;
    end;
    return public.powerhouse_jsonb_object_v1(v_parsed);
  end if;

  if v_type='array' then
    for v_item in select value from jsonb_array_elements(p_value)
    loop
      v_result := v_result || public.powerhouse_jsonb_object_v1(v_item);
    end loop;
    return v_result;
  end if;

  return '{}'::jsonb;
end;
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_content_outcomes_v1(p_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  r record;
  v_ob_channel text;
  v_status text;
  v_updated integer := 0;
  v_blocked integer := 0;
  v_provider_verified integer := 0;
  v_outcome_verified integer := 0;
  v_provider_side_effect boolean;
begin
  perform public.sync_content_publication_obligations(p_date, p_date);

  for r in
    select d.channel, d.state, d.delivery_ref, public.powerhouse_jsonb_object_v1(d.delivery_evidence) evidence
      from public.powerhouse_channel_decisions d
     where d.run_date = p_date
       and d.channel in ('linkedin_personal','linkedin_company','instagram_company')
  loop
    v_ob_channel := case when r.channel='instagram_company' then 'instagram' else r.channel end;

    v_provider_side_effect :=
      nullif(coalesce(r.delivery_ref,''),'') is not null
      and (
        public.powerhouse_jsonb_true(r.evidence,'provider_create_success')
        or public.powerhouse_jsonb_true(r.evidence,'provider_publication_ack_verified')
        or public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified')
        or public.powerhouse_jsonb_true(r.evidence,'terminal_provider_side_effect')
      );

    -- Provider-write truth is terminal for anti-duplicate purposes.
    -- Later token/readback/ACL/media-proof drift may enrich evidence, but may not
    -- retroactively turn an already-created provider side effect into BLOCKED.
    if v_provider_side_effect then
      update public.content_publication_obligations
         set status = case
               when status in ('LIVE_PROVEN','MEASURED','LEARNED') then status
               else 'PUBLISHED'
             end,
             external_id = coalesce(nullif(r.delivery_ref,''), external_id),
             canonical_url = case
               when r.channel in ('linkedin_personal','linkedin_company')
                    and (
                      coalesce(r.delivery_ref,'') like 'urn:li:share:%'
                      or coalesce(r.delivery_ref,'') like 'urn:li:ugcPost:%'
                    )
                 then 'https://www.linkedin.com/feed/update/' || r.delivery_ref || '/'
               else canonical_url
             end,
             evidence = public.powerhouse_jsonb_object_v1(evidence)
               || r.evidence
               || jsonb_build_object(
                    'reconciler','powerhouse_reconcile_content_outcomes_v1',
                    'provider_publication_ack_verified',true,
                    'terminal_provider_side_effect',true,
                    'republish_forbidden',true,
                    'reconciled_at',now(),
                    'terminality_contract','social-provider-write-terminal-v1'
                  ),
             last_error = null,
             next_action = 'Collect outcome metrics; reconcile this exact provider ID only. Never republish an already-created side effect.',
             published_at = coalesce(published_at, now()),
             updated_at = now()
       where tenant_id='canonical'
         and publication_date=p_date
         and channel=v_ob_channel;
      if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') then
        v_provider_verified := v_provider_verified + 1;
      end if;
      v_updated := v_updated + 1;
      continue;
    end if;

    if coalesce(r.evidence->>'error','') = 'PROVIDER_RECORD_MISSING'
       or public.powerhouse_jsonb_true(r.evidence,'stale_delivery_ref') then
      update public.content_publication_obligations
         set status='BLOCKED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=public.powerhouse_jsonb_object_v1(evidence)
               || r.evidence
               || jsonb_build_object(
                    'reconciler','powerhouse_reconcile_content_outcomes_v1',
                    'provider_truth_verified',false,
                    'reconciled_at',now(),
                    'reconciliation_reason','PROVIDER_RECORD_MISSING'
                  ),
             last_error='PROVIDER_RECORD_MISSING',
             next_action='Provider record ontbreekt; re-enter canonieke loop na truth/idempotency preflight. Geen blinde replacement.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if r.channel='linkedin_personal'
       and r.state in ('content_ready','scheduled','published')
       and not (
         public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified') is true
         or (
           public.powerhouse_jsonb_true(r.evidence,'observational_personal_theme_verified') is true
           and public.powerhouse_jsonb_true(r.evidence,'public_theme_source_verified') is true
           and coalesce((r.evidence->>'first_person_claims_present')::boolean,true) is false
         )
       ) then
      update public.content_publication_obligations
         set status='BLOCKED',
             evidence=public.powerhouse_jsonb_object_v1(evidence)
               || jsonb_build_object(
                    'reconciler','powerhouse_reconcile_content_outcomes_v1',
                    'personal_truth_verified',false,
                    'reconciled_at',now()
                  ),
             last_error='PERSONAL_SOURCE_UNVERIFIED',
             next_action='Persoonlijk LinkedIn blijft fail-closed tot geverifieerde persoonlijke waarheid of geverifieerde brongebonden observatie-evidence bestaat.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') is true then
      v_provider_verified := v_provider_verified + 1;
      if r.state='published' then
        v_status := 'PUBLISHED';
      elsif r.state='scheduled' then
        v_status := 'DISPATCHED';
      else
        v_status := null;
      end if;

      if v_status is not null then
        update public.content_publication_obligations
           set status=v_status,
               external_id=coalesce(nullif(r.delivery_ref,''),external_id),
               evidence=public.powerhouse_jsonb_object_v1(evidence)
                 || r.evidence
                 || jsonb_build_object(
                      'reconciler','powerhouse_reconcile_content_outcomes_v1',
                      'provider_truth_verified',true,
                      'reconciled_at',now()
                    ),
               last_error=null,
               updated_at=now()
         where tenant_id='canonical'
           and publication_date=p_date
           and channel=v_ob_channel
           and status not in ('LIVE_PROVEN','MEASURED','LEARNED');
        v_updated := v_updated + 1;
      end if;
    end if;
  end loop;

  update public.content_publication_obligations
     set status='BLOCKED',
         evidence=public.powerhouse_jsonb_object_v1(evidence)
           || jsonb_build_object(
                'reconciler','powerhouse_reconcile_content_outcomes_v1',
                'provider_truth_verified',public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_truth_verified'),
                'reconciled_at',now(),
                'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'
              ),
         last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED',
         next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS vóór een toekomstige provider write.',
         updated_at=now()
   where tenant_id='canonical'
     and publication_date=p_date
     and channel='instagram'
     and coalesce(public.powerhouse_jsonb_object_v1(evidence)->>'provider_status','')='sent'
     and not (
       public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'exact_final_media_proven') is true
       and nullif(public.powerhouse_jsonb_object_v1(evidence)->>'final_media_sha256','') is not null
       and coalesce(public.powerhouse_jsonb_object_v1(evidence)->>'mira_gate_result','')='PASS'
     )
     and not (
       nullif(external_id,'') is not null
       and (
         public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_create_success')
         or public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_publication_ack_verified')
         or public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'provider_truth_verified')
         or public.powerhouse_jsonb_true(public.powerhouse_jsonb_object_v1(evidence),'terminal_provider_side_effect')
       )
     )
     and status not in ('LIVE_PROVEN','MEASURED','LEARNED');
  get diagnostics v_blocked = row_count;

  update public.content_publication_obligations o
     set status = case when o.status='PLANNED' then 'GENERATED' else o.status end,
         evidence=coalesce(o.evidence,'{}'::jsonb)
           || jsonb_build_object(
                'reconciler','powerhouse_reconcile_content_outcomes_v1',
                'artifact_truth_verified',true,
                'reconciled_at',now()
              ),
         next_action=case
           when o.status='PLANNED' then 'Canonical blog artifact gereed; continue via approved central queue → BG169 → public proof.'
           else o.next_action
         end,
         updated_at=now()
   where o.tenant_id='canonical'
     and o.publication_date=p_date
     and o.channel='blog'
     and exists (
       select 1
       from public.powerhouse_content_artifacts a
       join public.powerhouse_channel_decisions d
         on d.run_date=a.run_date and d.channel=a.channel
       where a.run_date=p_date
         and a.channel='blog'
         and a.status='content_ready'
         and d.decision='publish'
         and d.state='content_ready'
     )
     and o.status not in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

  select
    count(*) filter (where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')),
    count(*) filter (where status in ('BLOCKED','FAILED'))
    into v_outcome_verified, v_blocked
    from public.content_publication_obligations
   where tenant_id='canonical'
     and publication_date=p_date
     and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  return jsonb_build_object(
    'ok',v_blocked=0,
    'publication_date',p_date,
    'updated',v_updated,
    'provider_truth_verified_count',v_provider_verified,
    'outcome_verified_count',v_outcome_verified,
    'blocked_count',v_blocked,
    'truth_contract','GREEN MEANS OUTCOME VERIFIED',
    'provider_side_effect_contract','social-provider-write-terminal-v1',
    'missing_provider_fingerprint','PROVIDER_RECORD_MISSING'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_content_publication_state(p_tenant_id text, p_publication_date date, p_channel text, p_status text, p_content_id text DEFAULT NULL::text, p_slug text DEFAULT NULL::text, p_external_id text DEFAULT NULL::text, p_canonical_url text DEFAULT NULL::text, p_evidence jsonb DEFAULT '{}'::jsonb, p_metrics jsonb DEFAULT '{}'::jsonb, p_next_action text DEFAULT NULL::text, p_error text DEFAULT NULL::text)
 RETURNS content_publication_obligations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.content_publication_obligations%rowtype;
  v_old_rank integer;
  v_new_rank integer;
  v_tenant_id text;
begin
  v_tenant_id := case when p_tenant_id in ('canonical','bedrijfsgeheugen') then 'canonical' else p_tenant_id end;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id=v_tenant_id
    and publication_date=p_publication_date
    and channel=p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  v_old_rank:=public.content_publication_state_rank(v_row.status);
  v_new_rank:=public.content_publication_state_rank(p_status);

  if v_new_rank<0 then
    raise exception 'INVALID_PUBLICATION_STATE';
  end if;

  if v_row.status not in ('BLOCKED','FAILED')
     and p_status not in ('BLOCKED','FAILED')
     and v_new_rank<v_old_rank then
    return v_row;
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and coalesce(nullif(p_canonical_url,''),nullif(p_external_id,''),nullif(v_row.canonical_url,''),nullif(v_row.external_id,'')) is null then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and public.powerhouse_jsonb_object_v1(p_evidence)='{}'::jsonb
     and public.powerhouse_jsonb_object_v1(v_row.evidence)='{}'::jsonb then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  update public.content_publication_obligations
  set status=p_status,
      content_id=coalesce(nullif(content_id,''),nullif(p_content_id,'')),
      slug=coalesce(nullif(slug,''),nullif(p_slug,'')),
      external_id=coalesce(nullif(p_external_id,''),external_id),
      canonical_url=coalesce(nullif(canonical_url,''),nullif(p_canonical_url,'')),
      evidence=case when public.powerhouse_jsonb_object_v1(p_evidence)='{}'::jsonb then public.powerhouse_jsonb_object_v1(evidence) else public.powerhouse_jsonb_object_v1(evidence)||public.powerhouse_jsonb_object_v1(p_evidence) end,
      metrics=case when public.powerhouse_jsonb_object_v1(p_metrics)='{}'::jsonb then public.powerhouse_jsonb_object_v1(metrics) else public.powerhouse_jsonb_object_v1(metrics)||public.powerhouse_jsonb_object_v1(p_metrics) end,
      next_action=coalesce(p_next_action,next_action),
      last_error=case when p_status in ('BLOCKED','FAILED') then coalesce(p_error,last_error) else null end,
      recovery_attempts=recovery_attempts+case when p_status in ('BLOCKED','FAILED') then 1 else 0 end,
      generated_at=case when p_status in ('GENERATED','APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(generated_at,now()) else generated_at end,
      approved_at=case when p_status in ('APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(approved_at,now()) else approved_at end,
      dispatched_at=case when p_status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(dispatched_at,now()) else dispatched_at end,
      published_at=case when p_status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(published_at,now()) else published_at end,
      live_proven_at=case when p_status in ('LIVE_PROVEN','MEASURED','LEARNED') then coalesce(live_proven_at,now()) else live_proven_at end,
      measured_at=case when p_status in ('MEASURED','LEARNED') then coalesce(measured_at,now()) else measured_at end,
      learned_at=case when p_status='LEARNED' then coalesce(learned_at,now()) else learned_at end,
      updated_at=now()
  where tenant_id=v_tenant_id
    and publication_date=p_publication_date
    and channel=p_channel
  returning * into v_row;

  return v_row;
end;
$function$;

-- Repair legacy 2026-10-06 evidence without inventing provider-side effects.
update public.powerhouse_content_artifacts
set generation_evidence=public.powerhouse_jsonb_object_v1(generation_evidence),
    updated_at=now()
where run_date='2026-10-06'
  and jsonb_typeof(generation_evidence) <> 'object';

update public.content_publication_obligations
set evidence=jsonb_strip_nulls(jsonb_build_object(
      'provider','github-protected-daily-blog',
      'executor','powerhouse-blog-queue',
      'source_of_truth','powerhouse_content_artifacts',
      'slug',slug,
      'canonical_url',canonical_url,
      'artifact_truth_verified',true,
      'reconciler','powerhouse_reconcile_content_outcomes_v1',
      'reconciled_at',now(),
      'recovery_contract','powerhouse|prewrite-obligation|external-mutation-recovery|v1'
    )),
    updated_at=now()
where tenant_id='canonical' and publication_date='2026-10-06' and channel='blog'
  and external_id is null;

update public.content_publication_obligations
set evidence=jsonb_build_object(
      'error','MEDIA_ASSET_REQUIRED','provider_truth_verified',false,
      'reconciler','powerhouse_reconcile_content_outcomes_v1','reconciled_at',now()
    ), updated_at=now()
where tenant_id='canonical' and publication_date='2026-10-06' and channel='instagram'
  and external_id is null;

update public.content_publication_obligations
set evidence=jsonb_build_object(
      'error','PERSONAL_SOURCE_UNVERIFIED','provider_truth_verified',false,
      'personal_truth_verified',false,'reconciler','powerhouse_reconcile_content_outcomes_v1',
      'reconciled_at',now()
    ), updated_at=now()
where tenant_id='canonical' and publication_date='2026-10-06' and channel='linkedin_personal'
  and external_id is null;

update public.content_publication_obligations
set evidence=public.powerhouse_jsonb_object_v1(evidence), updated_at=now()
where tenant_id='canonical' and publication_date='2026-10-06' and channel='linkedin_company';

update public.powerhouse_channel_decisions d
set delivery_evidence=jsonb_strip_nulls(jsonb_build_object(
      'provider','github-protected-daily-blog','executor','powerhouse-blog-queue',
      'source_of_truth','powerhouse_content_artifacts','slug',o.slug,
      'canonical_url',o.canonical_url,'artifact_truth_verified',true,'reconciled_at',now()
    )), updated_at=now()
from public.content_publication_obligations o
where d.run_date='2026-10-06' and d.channel='blog'
  and o.tenant_id='canonical' and o.publication_date=d.run_date and o.channel='blog'
  and o.external_id is null;

update public.powerhouse_channel_decisions
set delivery_evidence=jsonb_build_object(
      'error','MEDIA_ASSET_REQUIRED','provider_truth_verified',false,'reconciled_at',now()
    ), updated_at=now()
where run_date='2026-10-06' and channel='instagram_company' and delivery_ref is null;

update public.powerhouse_channel_decisions
set delivery_evidence=jsonb_build_object(
      'error','PERSONAL_SOURCE_UNVERIFIED','provider_truth_verified',false,
      'personal_truth_verified',false,'observational_personal_theme_verified',false,
      'reconciled_at',now()
    ), updated_at=now()
where run_date='2026-10-06' and channel='linkedin_personal' and delivery_ref is null;

update public.powerhouse_channel_decisions
set delivery_evidence=public.powerhouse_jsonb_object_v1(delivery_evidence), updated_at=now()
where run_date='2026-10-06' and channel='linkedin_company' and delivery_ref is null;

-- Preserve public JSON helper intent while keeping state-changing RPCs internal.
revoke execute on function public.powerhouse_reconcile_content_outcomes_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_content_outcomes_v1(date) to service_role;
revoke execute on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text) to service_role;
