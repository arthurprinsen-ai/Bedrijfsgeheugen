-- Provider-created social side effects are terminal publication truth.
-- A later readback/auth/media verification failure must never negate an existing provider object.

create or replace function public.powerhouse_reconcile_content_outcomes_v1(
  p_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  r record;
  v_ob_channel text;
  v_status text;
  v_updated integer := 0;
  v_blocked integer := 0;
  v_provider_verified integer := 0;
  v_outcome_verified integer := 0;
  v_side_effect boolean := false;
begin
  perform public.sync_content_publication_obligations(p_date, p_date);

  for r in
    select d.channel, d.state, d.delivery_ref, coalesce(d.delivery_evidence,'{}'::jsonb) evidence
      from public.powerhouse_channel_decisions d
     where d.run_date = p_date
       and d.channel in ('linkedin_personal','linkedin_company','instagram_company')
  loop
    v_ob_channel := case when r.channel='instagram_company' then 'instagram' else r.channel end;

    v_side_effect :=
      nullif(coalesce(r.delivery_ref,''),'') is not null
      and lower(coalesce(r.evidence->>'provider','')) <> 'buffer'
      and (
        public.powerhouse_jsonb_true(r.evidence,'provider_create_success') is true
        or public.powerhouse_jsonb_true(r.evidence,'provider_publication_ack_verified') is true
        or (
          public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') is true
          and lower(coalesce(r.evidence->>'provider_status','')) in ('published','sent','live')
        )
      );

    if v_side_effect then
      update public.content_publication_obligations
         set status = case when status in ('LIVE_PROVEN','MEASURED','LEARNED') then status else 'PUBLISHED' end,
             external_id = coalesce(nullif(r.delivery_ref,''),external_id),
             evidence = coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'provider_publication_ack_verified',true,
               'provider_side_effect_authoritative',true,
               'republish_forbidden',true,
               'reconciled_at',now()
             ),
             last_error = null,
             next_action = 'Collect outcome metrics for the existing provider side effect; never republish this daily claim.',
             updated_at = now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_updated := v_updated + 1;
      if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') is true then
        v_provider_verified := v_provider_verified + 1;
      end if;
      continue;
    end if;

    if coalesce(r.evidence->>'error','') = 'PROVIDER_RECORD_MISSING'
       or public.powerhouse_jsonb_true(r.evidence,'stale_delivery_ref') then
      update public.content_publication_obligations
         set status='BLOCKED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
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
       and public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified') is not true then
      update public.content_publication_obligations
         set status='BLOCKED',
             evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'personal_truth_verified',false,
               'reconciled_at',now()
             ),
             last_error='PERSONAL_TRUTH_UNVERIFIED',
             next_action='Persoonlijk LinkedIn blijft fail-closed vóór provider-write tot expliciete personal_truth_verified=true evidence bestaat.',
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
               evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
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
         evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'reconciler','powerhouse_reconcile_content_outcomes_v1',
           'provider_truth_verified',public.powerhouse_jsonb_true(evidence,'provider_truth_verified'),
           'reconciled_at',now(),
           'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'
         ),
         last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED',
         next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS vóór provider-write.',
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
       nullif(coalesce(external_id,''),'') is not null
       and (
         public.powerhouse_jsonb_true(evidence,'provider_create_success') is true
         or public.powerhouse_jsonb_true(evidence,'provider_publication_ack_verified') is true
         or (
           public.powerhouse_jsonb_true(evidence,'provider_truth_verified') is true
           and lower(coalesce(evidence->>'provider_status','')) in ('published','sent','live')
         )
       )
     )
     and status not in ('MEASURED','LEARNED');

  update public.content_publication_obligations o
     set status = case when o.status='PLANNED' then 'GENERATED' else o.status end,
         evidence=coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object(
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
       join public.powerhouse_channel_decisions d on d.run_date=a.run_date and d.channel=a.channel
       where a.run_date=p_date
         and a.channel='blog'
         and a.status='content_ready'
         and d.decision='publish'
         and d.state='content_ready'
     )
     and o.status not in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

  select count(*) filter (where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED','PUBLISHED')),
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
    'truth_contract','PROVIDER CREATE ACK + DURABLE ID IS TERMINAL SIDE-EFFECT TRUTH',
    'missing_provider_fingerprint','PROVIDER_RECORD_MISSING'
  );
end;
$function$;
