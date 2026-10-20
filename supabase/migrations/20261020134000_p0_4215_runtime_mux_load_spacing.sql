-- P0 #4215 / #4198: lower postgres connection-start contention in the EXISTING scheduler.
-- Preserve job 171, command, ownership, active state, and all other jobs.
-- Original cadence: 36 triggers/hour (minutes 1,3,4 mod 5).
-- Mitigation cadence: 24 triggers/hour (minutes 1,3 mod 5).
-- Every 2-3 minutes, no new cron or parallel executor; incident can be rolled back.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10s';
DO $recovery$
DECLARE
  v_job record;
  v_original CONSTANT text := '1-59/5,3-59/5,4-59/5 * * * *';
  v_target CONSTANT text := '1-59/5,3-59/5 * * * *';
BEGIN
  -- Branch previews may not have production scheduler metadata.
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'PREVIEW_ONLY: cron.job missing; no production scheduler mutation';
    RETURN;
  END IF;
  SELECT jobid,jobname,schedule,active INTO v_job FROM cron.job WHERE jobid = 171;
  IF NOT FOUND THEN
    RAISE NOTICE 'PREVIEW_ONLY: original scheduler job 171 not provisioned; no mutation';
    RETURN;
  END IF;
  IF v_job.jobname IS DISTINCT FROM 'powerhouse-runtime-scheduler-mux-v1'
     OR v_job.active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'P0_4215_SCHEDULER_IDENTITY_OR_ACTIVE_GUARD_FAILED';
  END IF;
  IF v_job.schedule = v_target THEN
    RAISE NOTICE 'P0_4215_SCHEDULER_ALREADY_SPACED';
    RETURN;
  END IF;
  IF v_job.schedule IS DISTINCT FROM v_original THEN
    RAISE EXCEPTION 'P0_4215_SCHEDULER_DRIFT_GUARD_FAILED: %', v_job.schedule;
  END IF;

  -- Same pg_cron job: preserves command and active status; cuts start attempts
  -- and avoids original overlaps with commercial cron 116 / visual cron 130.
  PERFORM cron.alter_job(171, schedule => v_target);
  IF NOT EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobid = 171 AND jobname = 'powerhouse-runtime-scheduler-mux-v1'
      AND active IS TRUE AND schedule = v_target
  ) THEN
    RAISE EXCEPTION 'P0_4215_SCHEDULER_READBACK_FAILED';
  END IF;
END;
$recovery$;
COMMIT;
