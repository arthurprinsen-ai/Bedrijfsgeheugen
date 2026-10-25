-- P0 #4198: source-linked resilience receipts without a second scheduler or fabricated outcomes.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='20s';

DO $guard$
BEGIN
  IF to_regprocedure('public.powerhouse_execution_resilience_watchdog_v1(timestamp with time zone,integer,integer)') IS NULL
    OR to_regprocedure('public.powerhouse_record_loop_stage_v1(text,text,jsonb,timestamp with time zone)') IS NULL
  THEN RAISE EXCEPTION 'RESILIENCE_CANONICAL_SOURCE_MISSING'; END IF;
  -- Clean-room migration replay can hold the original pre-mux registry row
  -- (1-minute, old job name) even though the existing 5-minute mux task is real.
  -- Accept only those two independently observed state families.
  IF NOT EXISTS (
    SELECT 1 FROM cron.job j
    WHERE j.jobname='powerhouse-runtime-scheduler-mux-v1' AND j.active
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.pronamespace='public'::regnamespace
      AND p.proname='powerhouse_runtime_scheduler_mux_v1'
      AND position('execution-resilience-watchdog' in pg_get_functiondef(p.oid))>0
      AND position('if (m % 5) = 1' in pg_get_functiondef(p.oid))>0
  ) THEN RAISE EXCEPTION 'RESILIENCE_CANONICAL_MUX_TASK_NOT_PROVEN'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.powerhouse_loop_assurance_registry_v1
    WHERE loop_key='execution-resilience'
      AND (
        (cron_jobname='powerhouse-execution-resilience-watchdog-v1' AND expected_cadence_minutes=1)
        OR (cron_jobname='powerhouse-runtime-scheduler-mux-v1' AND expected_cadence_minutes IN (2,5))
      )
  ) THEN RAISE EXCEPTION 'RESILIENCE_ASSURANCE_OWNER_DRIFT'; END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.powerhouse_execution_resilience_watchdog_v1(p_now timestamp with time zone DEFAULT now(), p_timeout_seconds integer DEFAULT 120, p_limit integer DEFAULT 100)
 RETURNS TABLE(operation_id uuid, reconciliation_job_id uuid, action text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_candidate record;
  v_operation public.brain_operations;
  v_job public.brain_reconciliation_jobs;
  v_job_key text;
  v_recovery_scheduled integer := 0;
  v_stale_unreconciled integer := 0;
  v_guard_pass boolean := false;
  v_stage text;
begin
  if p_now is null or p_timeout_seconds < 10 or p_timeout_seconds > 86400 or p_limit < 1 or p_limit > 500 then
    raise exception 'VALIDATION_ERROR';
  end if;

  for v_candidate in
    select o.id,o.version,o.evidence
    from public.brain_operations o
    where o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')
      and o.evidence ? 'execution_resilience'
      and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=false
      and coalesce((o.evidence->>'selftest')::boolean,false)=false
      and coalesce(o.evidence->>'fixture_classification','') <> 'historical_selftest'
      and coalesce(
        nullif(o.evidence->'execution_resilience'->>'last_heartbeat_at','')::timestamptz,
        o.updated_at
      ) < p_now - make_interval(secs=>p_timeout_seconds)
    order by o.updated_at
    for update skip locked
    limit p_limit
  loop
    update public.brain_operations o
    set status='RESULT_UNKNOWN',
        evidence=o.evidence || jsonb_build_object(
          'execution_resilience',
          coalesce(o.evidence->'execution_resilience','{}'::jsonb) || jsonb_build_object(
            'state','RECOVERY_REQUIRED',
            'interruption_class','WORKER_LOST',
            'interrupted_at',clock_timestamp(),
            'recovery_required',true,
            'readback_before_replay',true
          )
        ),
        version=o.version+1,
        updated_at=now()
    where o.id=v_candidate.id
    returning * into v_operation;

    v_job_key:='execution-resilience:'||v_candidate.id::text||':v'||v_operation.version::text;
    v_job:=public.brain_schedule_reconciliation(
      v_job_key,v_candidate.id,'EXECUTION_RESILIENCE_RECOVERY',5,
      jsonb_build_object(
        'contract','powerhouse-execution-resilience-v1',
        'trigger','STALE_HEARTBEAT',
        'watchdog',true,
        'readback_before_replay',true
      )
    );
    operation_id:=v_candidate.id;
    reconciliation_job_id:=v_job.id;
    action:='RECOVERY_REQUIRED';
    v_recovery_scheduled := v_recovery_scheduled + 1;
    return next;
  end loop;

  -- Emit genuine audit evidence from this real five-minute watchdog,
  -- preserving all existing operation ownership and safe-replay guards.
  select count(*) into v_stale_unreconciled from public.brain_operations o
  where o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')
    and o.evidence ? 'execution_resilience'
    and coalesce((o.evidence->'execution_resilience'->>'recovery_required')::boolean,false)=false
    and coalesce((o.evidence->>'selftest')::boolean,false)=false
    and coalesce(o.evidence->>'fixture_classification','') <> 'historical_selftest'
    and coalesce(nullif(o.evidence->'execution_resilience'->>'last_heartbeat_at','')::timestamptz,o.updated_at)
      < p_now - make_interval(secs=>p_timeout_seconds);
  v_guard_pass := v_stale_unreconciled=0;

  foreach v_stage in array array['action','readback','outcome','measurement','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1(
      'execution-resilience',v_stage,
      jsonb_build_object(
        'contract','powerhouse-execution-resilience-v1',
        'evidence_type','verified_existing_watchdog_execution',
        'source_task','execution-resilience-watchdog',
        'watchdog_invocation_at',p_now,
        'stale_unreconciled_operations',v_stale_unreconciled,
        'recovery_jobs_scheduled_this_run',v_recovery_scheduled,
        'pass',case when v_stage='guard' then v_guard_pass else null end,
        'action_kind',case
          when v_stage='action' and v_guard_pass and v_recovery_scheduled=0 then 'VERIFIED_NO_OP'
          when v_stage='action' and v_recovery_scheduled>0 then 'RECOVERY_SCHEDULED'
          else 'OBSERVED' end,
        'truth_boundary','operational watchdog only; never provider output or customer revenue'
      ),p_now
    );
  end loop;
end;
$function$
;

-- The nested watchdog runs in the existing mux on minute MOD 5=1.
-- Cron itself has extra slots. The eight-stage receipts now arrive from
-- the actual watchdog, so 2x a 5-minute task cadence is evidence-based.
UPDATE public.powerhouse_loop_assurance_registry_v1
SET expected_cadence_minutes=5,
    cron_jobname='powerhouse-runtime-scheduler-mux-v1',
    evidence_contract=coalesce(evidence_contract,'{}'::jsonb) ||
      jsonb_build_object('authority','real watchdog + original stage receipts',
        'watchdog_task_cadence_minutes',5,
        'regression_stage_oracle_cadence_minutes',30,
        'guard_truth','stale_unreconciled_operations=0',
        'no_new_scheduler',true),
    updated_at=now()
WHERE loop_key='execution-resilience'
  AND (
    (cron_jobname='powerhouse-execution-resilience-watchdog-v1' AND expected_cadence_minutes=1)
    OR (cron_jobname='powerhouse-runtime-scheduler-mux-v1' AND expected_cadence_minutes IN (2,5))
  );

DO $post$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.powerhouse_loop_assurance_registry_v1
    WHERE loop_key='execution-resilience'
      AND expected_cadence_minutes=5
      AND cron_jobname='powerhouse-runtime-scheduler-mux-v1'
      AND evidence_contract->>'watchdog_task_cadence_minutes'='5'
  ) THEN RAISE EXCEPTION 'RESILIENCE_CADENCE_PARITY_NOT_PROVEN'; END IF;
END
$post$;

COMMIT;
