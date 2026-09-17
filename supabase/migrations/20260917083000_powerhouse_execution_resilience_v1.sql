-- Powerhouse execution resilience v1
-- Reuses canonical brain_operations + brain_reconciliation_jobs; no parallel run store.

create or replace function public.powerhouse_execution_heartbeat_v1(
  p_operation_id uuid,
  p_expected_version bigint,
  p_checkpoint text,
  p_side_effect_state text default 'NOT_STARTED',
  p_evidence jsonb default '{}'::jsonb
)
returns public.brain_operations
language plpgsql
as $$
declare
  v_current public.brain_operations;
  v_row public.brain_operations;
begin
  if p_operation_id is null
     or p_expected_version is null or p_expected_version < 1
     or nullif(btrim(p_checkpoint), '') is null
     or p_side_effect_state not in ('NOT_STARTED','EFFECT_APPLIED','VERIFIED')
     or p_evidence is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_current
  from public.brain_operations
  where id = p_operation_id
  for update;

  if not found then raise exception 'OPERATION_NOT_FOUND'; end if;
  if v_current.version is distinct from p_expected_version then raise exception 'STATE_VERSION_CONFLICT'; end if;
  if v_current.status in ('VERIFIED','FAILED','COMPENSATED') then raise exception 'OPERATION_TERMINAL'; end if;

  update public.brain_operations
  set evidence = coalesce(evidence, '{}'::jsonb) || p_evidence || jsonb_build_object(
        'execution_resilience',
        coalesce(evidence->'execution_resilience', '{}'::jsonb) || jsonb_build_object(
          'contract', 'powerhouse-execution-resilience-v1',
          'state', 'RUNNING',
          'last_verified_checkpoint', p_checkpoint,
          'last_heartbeat_at', clock_timestamp(),
          'side_effect_state', p_side_effect_state,
          'recovery_required', false
        )
      ),
      version = version + 1,
      updated_at = now()
  where id = p_operation_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.powerhouse_mark_execution_interrupted_v1(
  p_operation_id uuid,
  p_expected_version bigint,
  p_interruption_class text,
  p_checkpoint text,
  p_side_effect_state text default 'NOT_STARTED',
  p_evidence jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_current public.brain_operations;
  v_operation public.brain_operations;
  v_job public.brain_reconciliation_jobs;
  v_job_key text;
begin
  if p_operation_id is null
     or p_expected_version is null or p_expected_version < 1
     or p_interruption_class not in ('NETWORK_DISCONNECT','STREAM_INTERRUPTED','REASONING_ABORTED','TOOL_ABORTED','WORKER_LOST','TIMEOUT','SESSION_INTERRUPTED','UNKNOWN_INTERRUPTION')
     or nullif(btrim(p_checkpoint), '') is null
     or p_side_effect_state not in ('NOT_STARTED','EFFECT_APPLIED','VERIFIED')
     or p_evidence is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_current
  from public.brain_operations
  where id = p_operation_id
  for update;

  if not found then raise exception 'OPERATION_NOT_FOUND'; end if;
  if v_current.version is distinct from p_expected_version then raise exception 'STATE_VERSION_CONFLICT'; end if;
  if v_current.status in ('VERIFIED','FAILED','COMPENSATED') then raise exception 'OPERATION_TERMINAL'; end if;

  update public.brain_operations
  set status = 'RESULT_UNKNOWN',
      evidence = coalesce(evidence, '{}'::jsonb) || p_evidence || jsonb_build_object(
        'execution_resilience',
        coalesce(evidence->'execution_resilience', '{}'::jsonb) || jsonb_build_object(
          'contract', 'powerhouse-execution-resilience-v1',
          'state', 'RECOVERY_REQUIRED',
          'interruption_class', p_interruption_class,
          'last_verified_checkpoint', p_checkpoint,
          'last_heartbeat_at', coalesce(evidence->'execution_resilience'->'last_heartbeat_at', to_jsonb(updated_at)),
          'interrupted_at', clock_timestamp(),
          'side_effect_state', p_side_effect_state,
          'recovery_required', true,
          'readback_before_replay', true
        )
      ),
      version = version + 1,
      updated_at = now()
  where id = p_operation_id
  returning * into v_operation;

  v_job_key := 'execution-resilience:' || p_operation_id::text;
  v_job := public.brain_schedule_reconciliation(
    v_job_key,
    p_operation_id,
    'EXECUTION_INTERRUPTED',
    5,
    jsonb_build_object(
      'contract', 'powerhouse-execution-resilience-v1',
      'interruption_class', p_interruption_class,
      'last_verified_checkpoint', p_checkpoint,
      'side_effect_state', p_side_effect_state,
      'readback_before_replay', true
    )
  );

  return jsonb_build_object('operation', to_jsonb(v_operation), 'reconciliation_job', to_jsonb(v_job));
end;
$$;

create or replace function public.powerhouse_execution_resilience_watchdog_v1(
  p_now timestamptz default now(),
  p_timeout_seconds integer default 120,
  p_limit integer default 100
)
returns table(operation_id uuid, reconciliation_job_id uuid, action text)
language plpgsql
as $$
declare
  v_candidate record;
  v_job public.brain_reconciliation_jobs;
  v_job_key text;
begin
  if p_now is null or p_timeout_seconds < 10 or p_timeout_seconds > 86400 or p_limit < 1 or p_limit > 500 then
    raise exception 'VALIDATION_ERROR';
  end if;

  for v_candidate in
    select o.id, o.version, o.evidence
    from public.brain_operations o
    where o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')
      and o.evidence ? 'execution_resilience'
      and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean, false) = false
      and coalesce(
        nullif(o.evidence->'execution_resilience'->>'last_heartbeat_at','')::timestamptz,
        o.updated_at
      ) < p_now - make_interval(secs => p_timeout_seconds)
    order by o.updated_at
    for update skip locked
    limit p_limit
  loop
    update public.brain_operations o
    set status = 'RESULT_UNKNOWN',
        evidence = o.evidence || jsonb_build_object(
          'execution_resilience',
          coalesce(o.evidence->'execution_resilience','{}'::jsonb) || jsonb_build_object(
            'state','RECOVERY_REQUIRED',
            'interruption_class','WORKER_LOST',
            'interrupted_at',clock_timestamp(),
            'recovery_required',true,
            'readback_before_replay',true
          )
        ),
        version = o.version + 1,
        updated_at = now()
    where o.id = v_candidate.id;

    v_job_key := 'execution-resilience:' || v_candidate.id::text;
    v_job := public.brain_schedule_reconciliation(
      v_job_key,
      v_candidate.id,
      'STALE_EXECUTION_HEARTBEAT',
      5,
      jsonb_build_object('contract','powerhouse-execution-resilience-v1','watchdog',true,'readback_before_replay',true)
    );

    operation_id := v_candidate.id;
    reconciliation_job_id := v_job.id;
    action := 'RECOVERY_REQUIRED';
    return next;
  end loop;
end;
$$;

comment on function public.powerhouse_execution_heartbeat_v1(uuid,bigint,text,text,jsonb) is
  'Records durable execution checkpoint/heartbeat in canonical brain_operations evidence.';
comment on function public.powerhouse_mark_execution_interrupted_v1(uuid,bigint,text,text,text,jsonb) is
  'Marks a non-terminal Powerhouse operation RESULT_UNKNOWN/RECOVERY_REQUIRED and schedules canonical reconciliation.';
comment on function public.powerhouse_execution_resilience_watchdog_v1(timestamptz,integer,integer) is
  'Finds stale resilience-enabled operations and schedules canonical recovery without replaying side effects.';
