-- P0 #4198: restore independent email execution inside the single canonical commercial scheduler.
-- Idempotent, no new pg_cron job, safe when isolated Supabase preview has no production scheduler.
DO $migration$
DECLARE
  v_job record;
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'CANONICAL_SCHEDULER_NOT_PRESENT_NO_OP';
    RETURN;
  END IF;
  SELECT jobid, command INTO v_job
  FROM cron.job
  WHERE jobid = 116
    AND jobname = 'powerhouse-commercial-learning-v1'
    AND schedule = '27 * * * *'
    AND active = true;

  IF NOT FOUND THEN
    RAISE NOTICE 'CANONICAL_COMMERCIAL_JOB_NOT_PRESENT_NO_OP';
    RETURN;
  END IF;
  IF position('POWERHOUSE_EMAIL_FALLBACK_DISPATCHED_WITH_CANONICAL_GATES' in v_job.command) > 0 THEN
    RAISE NOTICE 'EMAIL_FAULT_ISOLATION_ALREADY_CONFIGURED';
    RETURN;
  END IF;
  IF position('powerhouse_trigger_based_mkb_acquisition_cycle_v1' in v_job.command) = 0 THEN
    RAISE EXCEPTION 'CANONICAL_COMMERCIAL_COMMAND_UNEXPECTED_NO_REPLACEMENT';
  END IF;

  PERFORM cron.alter_job(job_id := v_job.jobid, command := $job_command$
DO $commercial_isolation$
DECLARE
  v_run_date date := (now() at time zone 'Europe/Amsterdam')::date;
  v_commercial_completed boolean := false;
BEGIN
  BEGIN
    IF EXISTS (
      SELECT 1 FROM public.powerhouse_connection_enrichment_coverage_v1
      WHERE enriched_today < total_connections
    ) THEN
      PERFORM public.powerhouse_commercial_intelligence_context_stage_v1(v_run_date);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'POWERHOUSE_DAILY_ENRICHMENT_FAILED: % %', SQLSTATE, SQLERRM;
  END;

  BEGIN
    PERFORM public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(v_run_date);
    v_commercial_completed := true;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'POWERHOUSE_MAIN_COMMERCIAL_STAGE_FAILED: % %', SQLSTATE, SQLERRM;
  END;

  IF NOT v_commercial_completed THEN
    BEGIN
      PERFORM public.powerhouse_prepare_autonomous_outreach_v1(v_run_date);
      PERFORM public.powerhouse_optimize_prepared_outreach_v1(v_run_date);
      PERFORM public.powerhouse_dispatch_autonomous_outreach_v1(v_run_date);
      RAISE NOTICE 'POWERHOUSE_EMAIL_FALLBACK_DISPATCHED_WITH_CANONICAL_GATES';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'POWERHOUSE_EMAIL_FALLBACK_FAILED: % %', SQLSTATE, SQLERRM;
    END;
  END IF;
END
$commercial_isolation$;
$job_command$);
END
$migration$;
