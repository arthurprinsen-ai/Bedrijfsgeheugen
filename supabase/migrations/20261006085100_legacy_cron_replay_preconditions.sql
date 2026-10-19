-- Replay correction for missing, real legacy cron jobs required by the
-- historical 20261006085416_stagger_cron_database_pressure_v1 migration.
-- This file sorts BEFORE the historical assertion. It does not modify any
-- applied migration, production data, source evidence, or protected check.
--
-- Current production already has the modern canonical runtime scheduler.
-- Never resurrect parallel legacy workers when that authority exists.
DO $replay_preconditions$
BEGIN
  IF to_regprocedure('public.powerhouse_runtime_scheduler_mux_v1(timestamptz)') IS NOT NULL THEN
    RAISE NOTICE 'CANONICAL_SCHEDULER_PRESENT: skipping historical job bootstrap';
    RETURN;
  END IF;

  -- A real task with its verified published procedure, not a no-op placeholder.
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='powerhouse-identity-graph-v1') THEN
    PERFORM cron.schedule(
      'powerhouse-identity-graph-v1',
      '2,17,32,47 * * * *',
      'select public.powerhouse_sync_identity_graph_batch_v1(100);'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='powerhouse-connection-activation-daily-v1') THEN
    PERFORM cron.schedule(
      'powerhouse-connection-activation-daily-v1',
      '24 6 * * *',
      $$select public.powerhouse_prepare_connection_activation_v1((now() at time zone 'Europe/Amsterdam')::date);$$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='powerhouse-content-orchestrator-daily-v1') THEN
    PERFORM cron.schedule(
      'powerhouse-content-orchestrator-daily-v1',
      '27 6 * * *',
      'select public.powerhouse_content_closed_loop_tick_v1();'
    );
  END IF;
END;
$replay_preconditions$;
