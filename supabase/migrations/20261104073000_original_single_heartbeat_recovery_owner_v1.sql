-- Original exclusive ONE BRAIN/Heartbeat #171 recovery owner; parent #4198.
-- Production proof 2026-11-04: original #171 every 5m runs watchdog + worker;
-- recently added original #184 every 15m runs THE SAME watchdog + worker.
-- Idempotent worker row locks prevent collision, but not needless parallel execution.
-- Restore ONE canonical scheduler by moving private aggregate proof to #171's
-- pre-existing terminal task receipt and retiring ONLY exact redundant #184.
-- Never replay provider side effects, lower publication/security gates, or
-- falsely treat 307 triage completions as 307 proven provider outcomes.

CREATE OR REPLACE FUNCTION public.powerhouse_runtime_mux_task_v1(p_task text, p_sql text, p_timeout_ms integer DEFAULT 10000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_started timestamptz:=clock_timestamp();
  v_prior_timeout text:=current_setting('statement_timeout');
  v_receipt jsonb := null;
  v_recovery_truth jsonb := null;
begin
  if p_timeout_ms < 1000 or p_timeout_ms > 30000 then
    raise exception 'VALIDATION_ERROR';
  end if;

  perform set_config('statement_timeout',p_timeout_ms::text,true);
  if p_task in ('one-brain-reconcile','terminal-autonomous-reconcile') then
    execute p_sql into v_receipt;
  else
    execute p_sql;
  end if;
  perform set_config('statement_timeout',v_prior_timeout,true);

  -- Only the original ONE BRAIN task returns a typed policy-error receipt.
  -- All unrelated mux tasks retain their existing execution contract.
  if p_task = 'one-brain-reconcile' and
     (v_receipt is null or
      coalesce((v_receipt->>'policy_promotion_error_count')::integer,0)>0) then
    return jsonb_build_object(
      'task',p_task,'ok',false,
      'state','ONE_BRAIN_POLICY_PROMOTION_DEGRADED',
      'error_count',coalesce((v_receipt->>'policy_promotion_error_count')::integer,0),
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  end if;

  -- The already-running canonical Heartbeat #171 is the ONLY recovery execution schedule.
  -- The terminal task must expose the original helper's private aggregate without
  -- translating triage completion into independently proven provider recovery.
  if p_task = 'terminal-autonomous-reconcile' then
    if v_receipt is null or
       coalesce(v_receipt->>'contract','') <> 'terminal-autonomous-reconciler-v2' then
      return jsonb_build_object(
        'task',p_task,'ok',false,'state','ORIGINAL_TERMINAL_RECEIPT_MISSING',
        'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
      );
    end if;

    v_recovery_truth := public.powerhouse_recovery_review_truth_v1();
    if v_recovery_truth is null or
       coalesce(v_recovery_truth->>'contract','') <> 'original-recovery-queue-outcome-proof-v1' or
       jsonb_typeof(v_recovery_truth->'explicitly_unresolved') <> 'number' or
       coalesce((v_recovery_truth->>'review_completion_is_provider_resolution')::boolean,true) then
      return jsonb_build_object(
        'task',p_task,'ok',false,'state','ORIGINAL_RECOVERY_PROOF_UNAVAILABLE',
        'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
      );
    end if;

    return jsonb_build_object(
      'task',p_task,'ok',true,
      'terminal_contract',v_receipt->>'contract',
      'recovery_review_truth',v_recovery_truth,
      'recovery_provider_resolution_proven',false,
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  end if;

  return jsonb_build_object(
    'task',p_task,
    'ok',true,
    'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
  );
exception
  when query_canceled then
    perform set_config('statement_timeout',v_prior_timeout,true);
    return jsonb_build_object(
      'task',p_task,
      'ok',false,
      'state','TIMEOUT',
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  when others then
    perform set_config('statement_timeout',v_prior_timeout,true);
    return jsonb_build_object(
      'task',p_task,
      'ok',false,
      'state','ERROR',
      'sqlstate',sqlstate,
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
end
$function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer)
  TO service_role;
COMMENT ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) IS
  'Original Heartbeat #171 unchanged task schedule, original ONE BRAIN fail-closed policy receipts and private recovery review-versus-provider evidence for the existing terminal task; no second recovery schedule.';

DO $original_one_owner$
DECLARE
  v_count integer;
  v_jobid bigint;
  v_jobname text;
  v_schedule text;
  v_command text;
BEGIN
  -- Fail closed if the one and only established original Heartbeat is not
  -- ACTIVE or its expected task owner/source command was altered.
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobid=171 AND active
      AND jobname='powerhouse-runtime-scheduler-mux-v1'
      AND command LIKE '%powerhouse_runtime_scheduler_mux_v3%'
      AND schedule='1-59/5,3-59/5,4-59/5 * * * *'
  ) THEN
    RAISE EXCEPTION 'CANONICAL_HEARTBEAT_171_NOT_VERIFIED';
  END IF;

  SELECT count(*) INTO v_count
    FROM cron.job WHERE active
      AND command ILIKE '%powerhouse_recovery_control_plane_tick_v1%';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_DUPLICATE_UNEXPECTED_COUNT:%',v_count;
  END IF;
  SELECT jobid,jobname,schedule,command
    INTO v_jobid,v_jobname,v_schedule,v_command
    FROM cron.job WHERE active
      AND command ILIKE '%powerhouse_recovery_control_plane_tick_v1%';
  IF v_jobname <> 'powerhouse-original-recovery-control-plane-v1'
     OR v_schedule <> '*/15 * * * *'
     OR trim(v_command) <> 'select public.powerhouse_recovery_control_plane_tick_v1();' THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_OWNER_SIGNATURE_DRIFT';
  END IF;
  -- The original internal function is preserved for authorized source proof.
  -- Only its redundant cron registration is retired; zero extra schedules.
  PERFORM cron.unschedule(v_jobid);
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE active
      AND command ILIKE '%powerhouse_recovery_control_plane_tick_v1%'
  ) THEN
    RAISE EXCEPTION 'REDUNDANT_RECOVERY_OWNER_NOT_RETIRED';
  END IF;
END;
$original_one_owner$;
