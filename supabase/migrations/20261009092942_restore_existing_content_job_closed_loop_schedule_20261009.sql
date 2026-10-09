-- Restore the single existing canonical content scheduler. Never introduce a second writer.
-- This exact migration was applied and read back in production on 2026-10-09.
DO $$
DECLARE v_job bigint;
BEGIN
  SELECT jobid INTO v_job
  FROM cron.job
  WHERE jobname = 'powerhouse-content-orchestrator-daily-v1'
    AND active IS TRUE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'EXISTING_CANONICAL_CONTENT_JOB_NOT_FOUND';
  END IF;
  IF to_regprocedure('public.powerhouse_content_closed_loop_tick_v1(timestamp with time zone)') IS NULL THEN
    RAISE EXCEPTION 'EXISTING_CONTENT_LOOP_TICK_MISSING';
  END IF;

  PERFORM cron.alter_job(
    v_job,
    '27 6-18 * * *',
    'select public.powerhouse_content_closed_loop_tick_v1();',
    NULL, NULL, TRUE
  );
END $$;
