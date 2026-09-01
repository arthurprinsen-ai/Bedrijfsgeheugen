create or replace function public.brain_run_due_value_evaluations(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.brain_value_evaluations%rowtype;
  v_owner text;
  v_processed integer := 0;
  v_verified integer := 0;
  v_waiting integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit,100), 500));
  v_payload_sha text;
begin
  for r in
    select *
    from public.brain_value_evaluations
    where due_at <= p_now
      and (
        status = 'PENDING'
        or (status = 'WAITING_FOR_EVIDENCE' and updated_at <= p_now - interval '23 hours')
      )
    order by due_at, tenant_id, outcome_id, horizon_days
    limit v_limit
    for update skip locked
  loop
    v_processed := v_processed + 1;
    select coalesce(nullif(owner_id,''),'Outcome Evaluation Runtime')
      into v_owner
    from public.brain_records
    where tenant_id = r.tenant_id
      and (record_id = r.outcome_id or subject_id = r.outcome_id)
    order by observed_at desc
    limit 1;
    v_owner := coalesce(v_owner,'Outcome Evaluation Runtime');

    if r.result is not null and cardinality(coalesce(r.evidence_ids,'{}'::text[])) > 0 then
      update public.brain_value_evaluations
      set status='VERIFIED', verified=true, verified_at=p_now, updated_at=p_now
      where tenant_id=r.tenant_id and outcome_id=r.outcome_id and horizon_days=r.horizon_days;

      perform public.brain_append_record(
        r.tenant_id,
        'value:'||r.tenant_id||':'||r.outcome_id||':'||r.horizon_days::text,
        'Value',
        'value',
        r.outcome_id,
        'outcome-horizon:'||r.tenant_id||':'||r.outcome_id,
        array[r.outcome_id],
        v_owner,
        'REALISED',
        p_now,
        true,
        true,
        r.result,
        coalesce(r.evidence_ids,'{}'::text[]),
        jsonb_build_object('source','brain_run_due_value_evaluations','dueAt',r.due_at,'evaluatedAt',p_now),
        jsonb_build_object('realised',true,'horizonDays',r.horizon_days,'dueAt',r.due_at,'evaluatedAt',p_now),
        'outcome-horizon:'||r.tenant_id||':'||r.outcome_id||':'||r.horizon_days::text,
        null
      );
      v_verified := v_verified + 1;
    else
      update public.brain_value_evaluations
      set status='WAITING_FOR_EVIDENCE', verified=false, updated_at=p_now
      where tenant_id=r.tenant_id and outcome_id=r.outcome_id and horizon_days=r.horizon_days;

      v_payload_sha := encode(digest(convert_to(r.tenant_id||'|'||r.outcome_id||'|'||r.horizon_days::text,'UTF8'),'sha256'),'hex');
      insert into public.brain_obligations(
        obligation_type,capability_id,business_entity,business_period,business_timezone,
        payload_sha256,owner,state,evidence
      ) values (
        'OUTCOME_HORIZON_EVIDENCE','outcome-horizon-evaluator',r.outcome_id,
        r.horizon_days::text,'UTC',v_payload_sha,v_owner,'OPEN',
        jsonb_build_object('tenantId',r.tenant_id,'outcomeId',r.outcome_id,'horizonDays',r.horizon_days,'dueAt',r.due_at,'lastEvaluatedAt',p_now,'reason','current evidence and result required')
      )
      on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone) do nothing;
      v_waiting := v_waiting + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'processed',v_processed,
    'verified',v_verified,
    'waitingForEvidence',v_waiting,
    'evaluatedAt',p_now
  );
end;
$$;

revoke all on function public.brain_run_due_value_evaluations(timestamptz,integer) from public, anon, authenticated;
grant execute on function public.brain_run_due_value_evaluations(timestamptz,integer) to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname='brain-outcome-horizon-hourly-v1') then
    perform cron.schedule(
      'brain-outcome-horizon-hourly-v1',
      '7 * * * *',
      'select public.brain_run_due_value_evaluations(now(),100);'
    );
  end if;
end $$;
