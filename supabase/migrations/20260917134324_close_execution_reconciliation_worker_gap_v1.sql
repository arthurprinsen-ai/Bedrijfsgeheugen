create or replace function public.powerhouse_reconciliation_worker_v1(
  p_worker_id text default 'powerhouse-reconciliation-worker-v1',
  p_limit integer default 25
)
returns table(job_key text, action text, resulting_state text)
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_job public.brain_reconciliation_jobs;
  v_operation public.brain_operations;
  v_updated public.brain_operations;
  v_recorded public.brain_reconciliation_jobs;
  v_evidence jsonb;
begin
  if nullif(btrim(p_worker_id),'') is null or p_limit < 1 or p_limit > 100 then
    raise exception 'VALIDATION_ERROR';
  end if;

  for v_job in
    select * from public.brain_claim_reconciliation(p_worker_id,p_limit,90)
  loop
    select * into v_operation
      from public.brain_operations
     where id=v_job.operation_id
     for update;

    if not found then
      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'NO_PROGRESS',
        jsonb_build_object('reason','OPERATION_NOT_FOUND'),
        'OPERATION_NOT_FOUND',300,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object('worker',p_worker_id,'failure','OPERATION_NOT_FOUND','checked_at',clock_timestamp())
      );
      job_key := v_job.job_key; action := 'FAIL_CLOSED'; resulting_state := v_recorded.state; return next;
      continue;
    end if;

    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and coalesce((v_operation.evidence->>'selftest')::boolean,false)=true
       and v_operation.operation_type='SELFTEST'
       and v_operation.status='RESULT_UNKNOWN'
       and v_operation.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
       and coalesce((v_operation.evidence->'execution_resilience'->>'readback_before_replay')::boolean,false)=true then

      v_evidence := v_operation.evidence || jsonb_build_object(
        'execution_resilience',
        coalesce(v_operation.evidence->'execution_resilience','{}'::jsonb) || jsonb_build_object(
          'state','RECOVERED_VERIFIED',
          'recovery_required',false,
          'recovery_worker',p_worker_id,
          'recovered_at',clock_timestamp(),
          'readback_result','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false
        ),
        'recovery_closure_proof',jsonb_build_object(
          'contract','powerhouse-execution-resilience-v1',
          'job_key',v_job.job_key,
          'claim_attempt',v_job.attempt_count,
          'readback_before_replay',true,
          'terminal_status','VERIFIED'
        )
      );

      v_updated := public.brain_transition_operation(
        v_operation.id,v_operation.version,'VERIFIED',null,null,v_evidence
      );

      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'RESOLVED',
        jsonb_build_object(
          'operation_id',v_updated.id,
          'operation_status',v_updated.status,
          'operation_version',v_updated.version,
          'readback','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false
        ),
        null,60,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'closure','READBACK_VERIFIED_NO_REPLAY',
          'resolved_at',clock_timestamp()
        )
      );

      job_key := v_job.job_key; action := 'RESOLVED_BY_READBACK'; resulting_state := v_recorded.state; return next;
    else
      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'NO_PROGRESS',
        jsonb_build_object(
          'operation_id',v_operation.id,
          'operation_status',v_operation.status,
          'reason','NO_SAFE_CANONICAL_RECOVERY_HANDLER'
        ),
        'NO_SAFE_CANONICAL_RECOVERY_HANDLER',300,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'fail_closed',true,
          'readback_before_replay',true,
          'checked_at',clock_timestamp()
        )
      );
      job_key := v_job.job_key; action := 'FAIL_CLOSED'; resulting_state := v_recorded.state; return next;
    end if;
  end loop;
end;
$function$;

select cron.schedule(
  'powerhouse-reconciliation-worker-v1',
  '* * * * *',
  'select public.powerhouse_reconciliation_worker_v1();'
);
