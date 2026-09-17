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
begin
  perform public.sync_content_publication_obligations(p_date, p_date);

  for r in
    select d.channel, d.state, d.delivery_ref, coalesce(d.delivery_evidence,'{}'::jsonb) evidence
      from public.powerhouse_channel_decisions d
     where d.run_date = p_date
       and d.channel in ('linkedin_personal','linkedin_company','instagram_company')
  loop
    v_ob_channel := case when r.channel='instagram_company' then 'instagram' else r.channel end;

    if public.powerhouse_jsonb_true(r.evidence,'content_integrity_invalidated') then
      update public.content_publication_obligations
         set status='BLOCKED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'content_integrity_invalidated',true,
               'reconciled_at',now(),
               'reconciliation_reason','CONTENT_INTEGRITY_INVALIDATED'),
             last_error='CONTENT_INTEGRITY_INVALIDATED',
             next_action='Transportbewijs telt niet als geldige publicatie wanneer final-copy/content-integrity is afgekeurd; niet promoten naar LIVE_PROVEN of learning.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if coalesce(r.evidence->>'error','') = 'PROVIDER_RECORD_MISSING'
       or public.powerhouse_jsonb_true(r.evidence,'stale_delivery_ref') then
      update public.content_publication_obligations
         set status='BLOCKED', external_id=coalesce(nullif(r.delivery_ref,''),external_id), evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object('reconciler','powerhouse_reconcile_content_outcomes_v1','provider_truth_verified',false,'reconciled_at',now(),'reconciliation_reason','PROVIDER_RECORD_MISSING'), last_error='PROVIDER_RECORD_MISSING', next_action='Provider record ontbreekt; re-enter canonieke loop na truth/idempotency preflight. Geen blinde replacement.', updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1; v_updated := v_updated + 1; continue;
    end if;

    if r.channel='linkedin_personal' and r.state in ('content_ready','scheduled','published') and public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified') is not true then
      update public.content_publication_obligations
         set status='BLOCKED', evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object('reconciler','powerhouse_reconcile_content_outcomes_v1','personal_truth_verified',false,'reconciled_at',now()), last_error='PERSONAL_TRUTH_UNVERIFIED', next_action='Persoonlijk LinkedIn blijft fail-closed tot expliciete personal_truth_verified=true evidence bestaat.', updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1; v_updated := v_updated + 1; continue;
    end if;

    if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') is true then
      v_provider_verified := v_provider_verified + 1;
      if r.state='published' then v_status := 'PUBLISHED'; elsif r.state='scheduled' then v_status := 'DISPATCHED'; else v_status := null; end if;
      if v_status is not null then
        update public.content_publication_obligations
           set status=v_status, external_id=coalesce(nullif(r.delivery_ref,''),external_id), evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object('reconciler','powerhouse_reconcile_content_outcomes_v1','provider_truth_verified',true,'reconciled_at',now()), last_error=null, updated_at=now()
         where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel and status not in ('LIVE_PROVEN','MEASURED','LEARNED');
        v_updated := v_updated + 1;
      end if;
    end if;
  end loop;

  update public.content_publication_obligations
     set status='BLOCKED', evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object('reconciler','powerhouse_reconcile_content_outcomes_v1','provider_truth_verified',public.powerhouse_jsonb_true(evidence,'provider_truth_verified'),'reconciled_at',now(),'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'), last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED', next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS; transport sent alleen is onvoldoende.', updated_at=now()
   where tenant_id='canonical' and publication_date=p_date and channel='instagram'
     and coalesce(evidence->>'provider_status','')='sent'
     and not (public.powerhouse_jsonb_true(evidence,'exact_final_media_proven') is true and nullif(evidence->>'final_media_sha256','') is not null and coalesce(evidence->>'mira_gate_result','')='PASS')
     and status not in ('MEASURED','LEARNED');
  get diagnostics v_blocked = row_count;

  update public.content_publication_obligations o
     set status = case when o.status='PLANNED' then 'GENERATED' else o.status end, evidence=coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object('reconciler','powerhouse_reconcile_content_outcomes_v1','artifact_truth_verified',true,'reconciled_at',now()), next_action=case when o.status='PLANNED' then 'Canonical blog artifact gereed; continue via approved central queue → BG169 → public proof.' else o.next_action end, updated_at=now()
   where o.tenant_id='canonical' and o.publication_date=p_date and o.channel='blog'
     and exists (select 1 from public.powerhouse_content_artifacts a join public.powerhouse_channel_decisions d on d.run_date=a.run_date and d.channel=a.channel where a.run_date=p_date and a.channel='blog' and a.status='content_ready' and d.decision='publish' and d.state='content_ready')
     and o.status not in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

  select count(*) filter (where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')), count(*) filter (where status in ('BLOCKED','FAILED')) into v_outcome_verified, v_blocked
    from public.content_publication_obligations where tenant_id='canonical' and publication_date=p_date and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  return jsonb_build_object('ok',v_blocked=0,'publication_date',p_date,'updated',v_updated,'provider_truth_verified_count',v_provider_verified,'outcome_verified_count',v_outcome_verified,'blocked_count',v_blocked,'truth_contract','GREEN MEANS OUTCOME VERIFIED','missing_provider_fingerprint','PROVIDER_RECORD_MISSING');
end;
$function$

