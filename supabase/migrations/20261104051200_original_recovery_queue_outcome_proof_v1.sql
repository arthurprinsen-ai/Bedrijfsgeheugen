-- Original ONE BRAIN/Powerhouse recovery owner, issue #4198.
-- 2026-11-04: triage completion is never provider/problem resolution.
-- One existing control-plane tick; NO new cron, worker, queue, publisher or replay.
-- SECURITY DEFINER is limited to an aggregate, read-only query and service_role-only EXECUTE.
CREATE OR REPLACE FUNCTION public.powerhouse_recovery_review_truth_v1()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, powerhouse_ops
AS $function$
  WITH truth AS (
    SELECT
      count(*) FILTER (WHERE q.status = 'succeeded') AS review_completed,
      count(*) FILTER (
        WHERE q.status = 'succeeded'
          AND (
            upper(coalesce(q.last_error, '')) LIKE '%UNRESOLVED%'
            OR upper(coalesce(t.resolution, '')) LIKE 'UNRESOLVED%'
          )
      ) AS explicitly_unresolved,
      count(*) FILTER (
        WHERE q.status = 'succeeded'
          AND t.queue_id IS NOT NULL
      ) AS with_original_triage_record,
      count(*) FILTER (
        WHERE q.status IN ('pending', 'running', 'failed', 'dead')
      ) AS review_nonterminal
    FROM powerhouse_ops.recovery_queue AS q
    LEFT JOIN powerhouse_ops.cron_failure_triage AS t ON t.queue_id = q.id
    WHERE q.task_key = 'cron_failure_review'
  )
  SELECT jsonb_build_object(
    'contract', 'original-recovery-queue-outcome-proof-v1',
    'original_owner', 'Powerhouse recovery queue / ONE BRAIN reliability agent',
    'review_completed', review_completed,
    'review_nonterminal', review_nonterminal,
    'review_with_original_triage_record', with_original_triage_record,
    'explicitly_unresolved', explicitly_unresolved,
    'review_completion_is_provider_resolution', false,
    'provider_resolution', 'NOT_PROVEN_FROM_TRIAGE_RECORD',
    'provider_success_count', NULL,
    'outcome_state',
      CASE
        WHEN explicitly_unresolved > 0 OR review_nonterminal > 0
          THEN 'EVIDENCE_DUE'
        ELSE 'SOURCE_CHECK_ONLY_PROVIDER_READBACK_DUE'
      END,
    'next_action', 'Original owner: verify source cron failure and actual original provider/task outcome; CAS-close individual incidents only with independent evidence. Never replay UNKNOWN side effects.'
  )
  FROM truth;
$function$;

REVOKE ALL ON FUNCTION public.powerhouse_recovery_review_truth_v1()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_recovery_review_truth_v1()
  TO service_role;

COMMENT ON FUNCTION public.powerhouse_recovery_review_truth_v1() IS
  'Original service-only read-only source truth. Succeeded cron failure reviews are triage outcomes, NOT verified provider recovery. Returns aggregate counters only; no PII, replay or scheduler.';

-- Augment the ORIGINAL recovery control-plane tick's result; its advisory lease,
-- watchdog, reconciliation worker, schedule, return ok and provider side effects are unchanged.
CREATE OR REPLACE FUNCTION public.powerhouse_recovery_control_plane_tick_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public','pg_catalog'
AS $function$
DECLARE
  v_locked boolean := false;
  v_watchdog_rows bigint := 0;
  v_reconcile_rows bigint := 0;
  v_recovery_truth jsonb;
  v_started_at timestamptz := clock_timestamp();
BEGIN
  SELECT pg_try_advisory_xact_lock(hashtextextended('powerhouse-recovery-control-plane-tick-v1', 0))
    INTO v_locked;

  IF NOT v_locked THEN
    RETURN jsonb_build_object(
      'ok', true,
      'state', 'SKIPPED_OVERLAP',
      'contract', 'powerhouse-recovery-control-plane-tick-v1',
      'outcome_state', 'NOT_EVALUATED_OVERLAPPING_ORIGINAL_OWNER',
      'observed_at', clock_timestamp()
    );
  END IF;

  SELECT count(*) INTO v_watchdog_rows
    FROM public.powerhouse_execution_resilience_watchdog_v1();

  SELECT count(*) INTO v_reconcile_rows
    FROM public.powerhouse_reconciliation_worker_v2();

  SELECT public.powerhouse_recovery_review_truth_v1()
    INTO v_recovery_truth;

  RETURN jsonb_build_object(
    'ok', true,
    'state', 'COMPLETED',
    'contract', 'powerhouse-recovery-control-plane-tick-v1',
    'watchdog_rows', v_watchdog_rows,
    'reconciliation_rows', v_reconcile_rows,
    'recovery_review_truth', v_recovery_truth,
    'recovery_provider_resolution_proven', false,
    'elapsed_ms', floor(extract(epoch from (clock_timestamp()-v_started_at))*1000)::bigint,
    'observed_at', clock_timestamp()
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_recovery_control_plane_tick_v1()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_recovery_control_plane_tick_v1()
  TO service_role;

COMMENT ON FUNCTION public.powerhouse_recovery_control_plane_tick_v1() IS
  'Original exclusive advisory-locked recovery owner: watchdog -> reconciliation -> private service-only recovery review source truth. Execution success never claims provider resolution.';
