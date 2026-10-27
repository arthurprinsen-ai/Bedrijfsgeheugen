-- linkedin-personal-dual-truth-terminal-v1
-- Persist production recovery: both verified first-person truth and verified
-- source-backed observational personal-life mode are valid personal LinkedIn truth modes.
-- Also derive canonical LinkedIn permalinks from the exact provider URN.

CREATE OR REPLACE FUNCTION public.enforce_linkedin_personal_artifact_identity_gate_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  e jsonb;
  truth_ok boolean;
  observational_ok boolean;
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('scheduled','published','measured','learned') then
    e := case
      when jsonb_typeof(new.generation_evidence->'identity_gate_evidence') = 'object'
        then new.generation_evidence->'identity_gate_evidence'
      else coalesce(new.generation_evidence,'{}'::jsonb)
    end;

    truth_ok :=
      public.powerhouse_jsonb_true(e,'personal_truth_verified') is true
      and public.powerhouse_jsonb_true(e,'arthur_anchor_verified') is true
      and public.powerhouse_jsonb_true(e,'first_person_claims_verified') is true
      and public.powerhouse_jsonb_true(e,'concrete_personal_anchor') is true
      and coalesce(e->>'identity_gate_result','PASS') = 'PASS';

    observational_ok :=
      public.powerhouse_jsonb_true(e,'observational_personal_theme_verified') is true
      and public.powerhouse_jsonb_true(e,'public_theme_source_verified') is true
      and coalesce((e->>'first_person_claims_present')::boolean,true) is false
      and public.powerhouse_jsonb_true(e,'personal_life_topic') is true
      and coalesce((e->>'business_topic')::boolean,false) is false;

    if coalesce((e->>'corporate_style')::boolean,false) is true
       or coalesce((e->>'corporate_voice')::boolean,false) is true
       or not (truth_ok or observational_ok) then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED: verified personal truth or verified observational personal-life source required before scheduling/publishing';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_linkedin_personal_obligation_identity_gate_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  gate_ok boolean;
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    select exists (
      select 1
      from public.powerhouse_content_artifacts a
      cross join lateral (
        select case
          when jsonb_typeof(a.generation_evidence->'identity_gate_evidence') = 'object'
            then a.generation_evidence->'identity_gate_evidence'
          else coalesce(a.generation_evidence,'{}'::jsonb)
        end as e
      ) g
      where a.run_date = new.publication_date
        and a.channel = 'linkedin_personal'
        and a.artifact_type = 'linkedin_post'
        and a.status not in ('blocked','failed')
        and coalesce((g.e->>'corporate_style')::boolean,false) is false
        and coalesce((g.e->>'corporate_voice')::boolean,false) is false
        and coalesce((g.e->>'business_topic')::boolean,false) is false
        and public.powerhouse_jsonb_true(g.e,'personal_life_topic') is true
        and (
          (
            public.powerhouse_jsonb_true(g.e,'personal_truth_verified') is true
            and public.powerhouse_jsonb_true(g.e,'arthur_anchor_verified') is true
            and public.powerhouse_jsonb_true(g.e,'first_person_claims_verified') is true
          )
          or
          (
            public.powerhouse_jsonb_true(g.e,'observational_personal_theme_verified') is true
            and public.powerhouse_jsonb_true(g.e,'public_theme_source_verified') is true
            and coalesce((g.e->>'first_person_claims_present')::boolean,true) is false
          )
        )
    ) into gate_ok;

    if not coalesce(gate_ok,false) then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_DISPATCH_BLOCKED: no artifact with verified personal truth or verified observational personal-life source';
    end if;
  end if;
  return new;
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
    select d.channel, d.state, d.delivery_ref, coalesce(d.delivery_evidence,'{}'::jsonb) evidence
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
             evidence = coalesce(evidence,'{}'::jsonb)
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
             evidence=coalesce(evidence,'{}'::jsonb)
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
             evidence=coalesce(evidence,'{}'::jsonb)
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
               evidence=coalesce(evidence,'{}'::jsonb)
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
         evidence=coalesce(evidence,'{}'::jsonb)
           || jsonb_build_object(
                'reconciler','powerhouse_reconcile_content_outcomes_v1',
                'provider_truth_verified',public.powerhouse_jsonb_true(evidence,'provider_truth_verified'),
                'reconciled_at',now(),
                'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'
              ),
         last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED',
         next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS vóór een toekomstige provider write.',
         updated_at=now()
   where tenant_id='canonical'
     and publication_date=p_date
     and channel='instagram'
     and coalesce(evidence->>'provider_status','')='sent'
     and not (
       public.powerhouse_jsonb_true(evidence,'exact_final_media_proven') is true
       and nullif(evidence->>'final_media_sha256','') is not null
       and coalesce(evidence->>'mira_gate_result','')='PASS'
     )
     and not (
       nullif(external_id,'') is not null
       and (
         public.powerhouse_jsonb_true(evidence,'provider_create_success')
         or public.powerhouse_jsonb_true(evidence,'provider_publication_ack_verified')
         or public.powerhouse_jsonb_true(evidence,'provider_truth_verified')
         or public.powerhouse_jsonb_true(evidence,'terminal_provider_side_effect')
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

-- Fail-closed execution boundary for SECURITY DEFINER reconciler.
revoke execute on function public.powerhouse_reconcile_content_outcomes_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_content_outcomes_v1(date) to service_role, postgres;
