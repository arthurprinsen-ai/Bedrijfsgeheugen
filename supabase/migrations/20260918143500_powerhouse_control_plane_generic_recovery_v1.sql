-- powerhouse generic recovery + next-action projection v1
-- Extends the existing canonical Brain control plane. No parallel queue, ledger or state machine.

create or replace function public.brain_create_operation(
  p_capability_id text,
  p_operation_type text,
  p_idempotency_key text,
  p_payload_sha256 text,
  p_change_id text default null,
  p_correlation_id text default null
)
returns public.brain_operations
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_operation public.brain_operations;
  v_actor_kind text;
  v_session_key text;
begin
  if nullif(btrim(p_capability_id), '') is null
     or nullif(btrim(p_operation_type), '') is null
     or nullif(btrim(p_idempotency_key), '') is null
     or nullif(btrim(p_payload_sha256), '') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_actor_kind := case
    when p_capability_id like 'agent:%' then 'agent'
    when coalesce(p_correlation_id,'') like 'chat-%' then 'chat'
    else 'runtime'
  end;
  v_session_key := coalesce(
    nullif(btrim(p_correlation_id),''),
    'op:'||encode(extensions.digest(p_capability_id||'|'||p_operation_type||'|'||p_idempotency_key,'sha256'),'hex')
  );

  perform set_config('powerhouse.control_plane_admission','brain_create_operation_v2',true);

  insert into public.brain_operations (
    capability_id, operation_type, idempotency_key, payload_sha256, change_id, correlation_id, evidence
  ) values (
    p_capability_id,
    p_operation_type,
    p_idempotency_key,
    p_payload_sha256,
    p_change_id,
    p_correlation_id,
    jsonb_build_object(
      'execution_resilience',
      jsonb_build_object(
        'contract','powerhouse-execution-resilience-v1',
        'state','PLANNED',
        'recovery_required',false,
        'readback_before_replay',true,
        'side_effect_state','NOT_STARTED',
        'last_heartbeat_at',clock_timestamp()
      )
    )
  )
  on conflict (capability_id, operation_type, idempotency_key) do nothing
  returning * into v_operation;

  if not found then
    select * into v_operation
      from public.brain_operations
     where capability_id=p_capability_id
       and operation_type=p_operation_type
       and idempotency_key=p_idempotency_key;
    if not found then raise exception 'OPERATION_IDEMPOTENCY_STATE_UNKNOWN'; end if;
    if v_operation.payload_sha256 is distinct from p_payload_sha256 then
      raise exception 'IDEMPOTENCY_PAYLOAD_CONFLICT';
    end if;
  end if;

  insert into public.brain_control_plane_bindings(
    operation_id,actor_kind,actor_id,session_key,admitted_via,admitted_by,evidence
  )
  values (
    v_operation.id,
    v_actor_kind,
    p_capability_id,
    v_session_key,
    'brain_create_operation_v2',
    session_user,
    jsonb_build_object(
      'contract','universal-agent-chat-control-plane-binding-proof-v1',
      'change_id',p_change_id,
      'correlation_id',p_correlation_id
    )
  )
  on conflict (operation_id) do nothing;

  if not exists(select 1 from public.brain_control_plane_bindings b where b.operation_id=v_operation.id) then
    raise exception 'CONTROL_PLANE_BINDING_MISSING';
  end if;

  return v_operation;
end;
$function$;

revoke execute on function public.brain_create_operation(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.brain_create_operation(text,text,text,text,text,text) to service_role;

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
        coalesce(v_job.evidence,'{}'::jsonb)
          || jsonb_build_object('worker',p_worker_id,'failure','OPERATION_NOT_FOUND','checked_at',clock_timestamp())
      );
      job_key := v_job.job_key;
      action := 'FAIL_CLOSED';
      resulting_state := v_recorded.state;
      return next;
      continue;
    end if;

    if v_job.reason='EXECUTION_RESILIENCE_RECOVERY'
       and v_operation.status='RESULT_UNKNOWN'
       and v_operation.evidence->'execution_resilience'->>'side_effect_state'='NOT_STARTED'
       and coalesce((v_operation.evidence->'execution_resilience'->>'readback_before_replay')::boolean,false)=true then

      v_evidence := v_operation.evidence || jsonb_build_object(
        'execution_resilience',
        coalesce(v_operation.evidence->'execution_resilience','{}'::jsonb) || jsonb_build_object(
          'state','RECOVERED_REPLANNED',
          'recovery_required',false,
          'recovery_worker',p_worker_id,
          'recovered_at',clock_timestamp(),
          'readback_result','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false,
          'next_action','DISPATCH'
        ),
        'recovery_closure_proof',jsonb_build_object(
          'contract','powerhouse-execution-resilience-v1',
          'job_key',v_job.job_key,
          'claim_attempt',v_job.attempt_count,
          'readback_before_replay',true,
          'terminal_status','REPLANNED_SAFE'
        )
      );

      v_updated := public.brain_transition_operation(
        v_operation.id,
        v_operation.version,
        'PLANNED',
        v_operation.dispatch_generation + 1,
        null,
        v_evidence
      );

      v_recorded := public.brain_record_reconciliation(
        v_job.job_key,p_worker_id,'RESOLVED',
        jsonb_build_object(
          'operation_id',v_updated.id,
          'operation_status',v_updated.status,
          'operation_version',v_updated.version,
          'dispatch_generation',v_updated.dispatch_generation,
          'readback','NO_SIDE_EFFECT_STARTED',
          'replay_performed',false,
          'next_action','DISPATCH'
        ),
        null,60,
        coalesce(v_job.evidence,'{}'::jsonb) || jsonb_build_object(
          'worker',p_worker_id,
          'closure','READBACK_VERIFIED_REPLANNED_SAFE',
          'resolved_at',clock_timestamp()
        )
      );

      job_key := v_job.job_key;
      action := 'REPLANNED_SAFE';
      resulting_state := v_recorded.state;
      return next;
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
      job_key := v_job.job_key;
      action := 'FAIL_CLOSED';
      resulting_state := v_recorded.state;
      return next;
    end if;
  end loop;
end;
$function$;

revoke execute on function public.powerhouse_reconciliation_worker_v1(text,integer) from public, anon, authenticated;
grant execute on function public.powerhouse_reconciliation_worker_v1(text,integer) to service_role;

create or replace view public.powerhouse_control_plane_next_action_v1
with (security_invoker = true)
as
select
  o.id as operation_id,
  o.capability_id,
  o.operation_type,
  o.status,
  o.version,
  o.dispatch_generation,
  o.change_id,
  o.correlation_id,
  o.updated_at,
  coalesce(o.evidence->'execution_resilience'->>'state','UNMANAGED') as recovery_state,
  coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false) as recovery_required,
  case
    when o.status in ('VERIFIED','COMPENSATED') then 'NONE'
    when o.status='FAILED' then 'REVIEW_FAILURE'
    when o.status='PLANNED' then 'DISPATCH'
    when o.status='DISPATCHED' then 'READBACK'
    when o.status='OBSERVED_SUCCEEDED' then 'VERIFY'
    when o.status='RESULT_UNKNOWN'
         and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)
      then 'RECONCILE'
    when o.status='RESULT_UNKNOWN' then 'READBACK_BEFORE_REPLAY'
    else 'WAIT'
  end as next_action
from public.brain_operations o;

revoke all on public.powerhouse_control_plane_next_action_v1 from public, anon, authenticated;
grant select on public.powerhouse_control_plane_next_action_v1 to service_role;

comment on view public.powerhouse_control_plane_next_action_v1 is
  'Canonical next-action projection over brain_operations. It is derived state only and never a second workflow authority.';
