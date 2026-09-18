-- powerhouse control-plane recovery supervisor v1
-- Adds deterministic next-action projection and safe replay only when readback proves no side effect started.

create or replace view public.powerhouse_control_plane_next_action_v1
with (security_invoker = true)
as
select
  bo.id as obligation_id,
  bo.business_entity as obligation_key,
  bo.state as obligation_state,
  bo.owner,
  bo.version as obligation_version,
  o.id as operation_id,
  o.operation_type,
  o.status as operation_status,
  o.version as operation_version,
  o.dispatch_generation,
  o.updated_at as operation_updated_at,
  case
    when bo.state in ('FULFILLED','BREACHED','CANCELLED') then 'NONE'
    when o.id is null then 'PLAN'
    when o.status='PLANNED' then 'DISPATCH'
    when o.status='DISPATCHED'
      and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=false
      then 'AWAIT_OR_WATCHDOG'
    when o.status='RESULT_UNKNOWN'
      and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=true
      then 'RECONCILE'
    when o.status='OBSERVED_SUCCEEDED' then 'VERIFY'
    when o.status='VERIFIED' and bo.state<>'FULFILLED' then 'CLOSE'
    when o.status='FAILED' then 'RECOVER_OR_COMPENSATE'
    else 'BLOCKED_REVIEW'
  end as next_action,
  coalesce(o.evidence->'execution_resilience','{}'::jsonb) as recovery_evidence,
  bo.evidence as obligation_evidence,
  o.evidence as operation_evidence
from public.brain_obligations bo
left join lateral (
  select o1.*
  from public.brain_operations o1
  where o1.correlation_id=bo.business_entity
  order by o1.updated_at desc,o1.created_at desc
  limit 1
) o on true;

revoke all on public.powerhouse_control_plane_next_action_v1 from public, anon, authenticated;
grant select on public.powerhouse_control_plane_next_action_v1 to service_role;

create or replace function public.powerhouse_reconciliation_worker_v2(
  p_worker_id text default 'powerhouse-reconciliation-worker-v2',
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
  v_resilience jsonb;
  v_safe_replay boolean;
  v_side_effect_state text;
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

    v_resilience := coalesce(v_operation.evidence->'execution_resilience','{}'::jsonb);
    v_safe_replay := coalesce((v_resilience->>'safe_replay')::boolean,false);
    v_side_effect_state := coalesce(nullif(v_resilience->>'side_effect_state',''),'UNKNOWN');

    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.status='RESULT_UNKNOWN'
       and coalesce((v_resilience->>'readback_before_replay')::boolean,false)=true
       and v_safe_replay=true
       and v_side_effect_state='NOT_STARTED' then

      v_updated := public.brain_transition_operation(
        v_operation.id,
        v_operation.version,
        'PLANNED',
        v_operation.dispatch_generation + 1,
        null,
        v_operation.evidence || jsonb_build_object(
          'execution_resilience',
          v_resilience || jsonb_build_object(
            'state','REPLANNED_SAFE_REPLAY',
            'recovery_required',false,
            'recovery_worker',p_worker_id,
            'replanned_at',clock_timestamp(),
            'readback_result','NO_SIDE_EFFECT_STARTED',
            'replay_authorized',true
          )
        )
      );

      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'RESOLVED',
        jsonb_build_object(
          'operation_id',v_updated.id,
          'operation_status',v_updated.status,
          'dispatch_generation',v_updated.dispatch_generation,
          'readback','NO_SIDE_EFFECT_STARTED',
          'replay_authorized',true
        ),
        null,60,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'closure','SAFE_REPLAN_AFTER_NEGATIVE_READBACK',
          'resolved_at',clock_timestamp()
        )
      );

      job_key := v_job.job_key; action := 'REPLANNED_SAFE_REPLAY'; resulting_state := v_recorded.state; return next;
      continue;
    end if;

    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.status='RESULT_UNKNOWN'
       and coalesce((v_resilience->>'readback_before_replay')::boolean,false)=true
       and v_side_effect_state in ('STARTED','SUCCEEDED','UNKNOWN') then
      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'NO_PROGRESS',
        jsonb_build_object(
          'operation_id',v_operation.id,
          'operation_status',v_operation.status,
          'reason','SIDE_EFFECT_STATE_NOT_SAFE_FOR_REPLAY',
          'side_effect_state',v_side_effect_state
        ),
        'SIDE_EFFECT_STATE_NOT_SAFE_FOR_REPLAY:'||v_side_effect_state,300,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'fail_closed',true,
          'checked_at',clock_timestamp()
        )
      );
      job_key := v_job.job_key; action := 'FAIL_CLOSED'; resulting_state := v_recorded.state; return next;
      continue;
    end if;

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
  end loop;
end;
$function$;

revoke execute on function public.powerhouse_reconciliation_worker_v2(text,integer) from public, anon, authenticated;
grant execute on function public.powerhouse_reconciliation_worker_v2(text,integer) to service_role;

comment on function public.powerhouse_reconciliation_worker_v2(text,integer) is
  'Canonical recovery worker. Automatic replay is allowed only after readback proves side_effect_state=NOT_STARTED and safe_replay=true. All uncertain side-effect states fail closed.';


-- Promote the canonical reconciliation scheduler to worker v2. Keep one scheduler authority.
do $$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname in ('powerhouse-reconciliation-worker-v1','powerhouse-reconciliation-worker-v2')
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-reconciliation-worker-v2',
    '* * * * *',
    'select public.powerhouse_reconciliation_worker_v2();'
  );
end
$$;
