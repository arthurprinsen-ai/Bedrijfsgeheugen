-- P0: restore unattended execution for the EXISTING one-and-only original
-- Powerhouse recovery control plane. No new recovery worker or second scheduler.
-- Canonical original function owns watchdog + reconciliation + advisory xact lease.
-- Fail-closed on any competing job rather than hiding a duplicate execution.
DO $original_recovery_schedule$
DECLARE
  v_name constant text := 'powerhouse-original-recovery-control-plane-v1';
  v_schedule constant text := '*/15 * * * *';
  v_command constant text := 'select public.powerhouse_recovery_control_plane_tick_v1();';
  v_existing cron.job%rowtype;
  v_recovery_jobs integer;
BEGIN
  IF to_regprocedure('public.powerhouse_recovery_control_plane_tick_v1()') IS NULL THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_OWNER_FUNCTION_NOT_DEPLOYED';
  END IF;
  IF to_regprocedure('public.powerhouse_recovery_review_truth_v1()') IS NULL THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_OUTCOME_PROOF_NOT_DEPLOYED';
  END IF;

  SELECT count(*) INTO v_recovery_jobs
    FROM cron.job
   WHERE active AND command ILIKE '%powerhouse_recovery_control_plane_tick_v1%';
  IF v_recovery_jobs > 0 THEN
    SELECT * INTO v_existing FROM cron.job
     WHERE active AND command ILIKE '%powerhouse_recovery_control_plane_tick_v1%'
     LIMIT 1;
    IF v_recovery_jobs = 1 AND v_existing.jobname = v_name
       AND v_existing.schedule = v_schedule
       AND trim(v_existing.command) = v_command THEN
      RETURN; -- idempotent: the exact original owner is already active.
    END IF;
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_CONTROL_PLANE_DUPLICATE_OWNER: %', v_recovery_jobs;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_name) THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_CONTROL_PLANE_JOB_NAME_CONFLICT';
  END IF;

  PERFORM cron.schedule(v_name, v_schedule, v_command);
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = v_name AND active
      AND schedule = v_schedule AND trim(command) = v_command
  ) THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_CRON_REGISTERED_NOT_ACTIVE';
  END IF;
END;
$original_recovery_schedule$;
