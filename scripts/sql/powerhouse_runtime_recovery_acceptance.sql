-- Read-only post-deploy infrastructure acceptance. This is NOT commercial
-- provider delivery proof or a substitute for protected CI/model governance.
-- Run after all four recovery migrations have been applied.
WITH
  jobs AS (
    SELECT jobname,jobid,active FROM cron.job
    WHERE jobname LIKE 'powerhouse-runtime-isolated-%'
       OR jobname IN ('powerhouse-runtime-extras-v4',
         'powerhouse-operational-retry-worker',
         'powerhouse-ops-independent-slot-reconciler',
         'powerhouse-runtime-scheduler-mux-v1')
  ),
  current_stats AS (
    SELECT
      count(*) FILTER (WHERE jobname LIKE 'powerhouse-runtime-isolated-%' AND active) AS isolated_active,
      count(*) FILTER (WHERE jobname='powerhouse-runtime-extras-v4' AND active) AS extras_active,
      count(*) FILTER (WHERE jobname='powerhouse-operational-retry-worker' AND active) AS retry_active,
      count(*) FILTER (WHERE jobname='powerhouse-ops-independent-slot-reconciler' AND active) AS reconciler_active,
      count(*) FILTER (WHERE jobname='powerhouse-runtime-scheduler-mux-v1' AND active) AS old_mux_active
    FROM jobs
  ),
  run_status AS (
    SELECT
      count(*) FILTER (WHERE d.status='succeeded') AS successful_runs_90m,
      count(*) FILTER (WHERE d.status<>'succeeded') AS unsuccessful_runs_90m,
      count(*) FILTER (WHERE d.return_message ILIKE '%timeout%') AS timeout_runs_90m
    FROM cron.job_run_details d JOIN jobs j ON j.jobid=d.jobid
    WHERE d.start_time>=now()-interval '90 minutes'
  ),
  queue_status AS (
    SELECT
      count(*) FILTER (WHERE state='pending') AS recovery_pending,
      count(*) FILTER (WHERE state='completed') AS recovery_completed,
      count(*) FILTER (WHERE state='dead_letter') AS recovery_dead_letter
    FROM powerhouse_ops.runtime_retry_queue
  )
SELECT
  now() AS observed_at,
  (SELECT isolated_active FROM current_stats) AS isolated_jobs_active,
  (SELECT extras_active FROM current_stats) AS extras_active,
  (SELECT retry_active FROM current_stats) AS retry_worker_active,
  (SELECT reconciler_active FROM current_stats) AS external_failure_reconciler_active,
  (SELECT old_mux_active FROM current_stats) AS obsolete_mux_active,
  (SELECT successful_runs_90m FROM run_status) AS successful_runs_90m,
  (SELECT unsuccessful_runs_90m FROM run_status) AS unsuccessful_runs_90m,
  (SELECT timeout_runs_90m FROM run_status) AS timeout_runs_90m,
  (SELECT recovery_pending FROM queue_status) AS recovery_pending,
  (SELECT recovery_completed FROM queue_status) AS recovery_completed,
  (SELECT recovery_dead_letter FROM queue_status) AS recovery_dead_letter,
  to_regprocedure('public.powerhouse_refresh_revenue_attribution_incremental_v1(timestamptz)') IS NOT NULL AS incremental_snapshot_function_present,
  CASE WHEN (SELECT isolated_active FROM current_stats)=16
    AND (SELECT extras_active FROM current_stats)=1
    AND (SELECT retry_active FROM current_stats)=1
    AND (SELECT reconciler_active FROM current_stats)=1
    AND (SELECT old_mux_active FROM current_stats)=0
    AND (SELECT successful_runs_90m FROM run_status)>0
    AND (SELECT timeout_runs_90m FROM run_status)=0
    AND (SELECT recovery_dead_letter FROM queue_status)=0
    AND to_regprocedure('public.powerhouse_refresh_revenue_attribution_incremental_v1(timestamptz)') IS NOT NULL
    THEN 'INFRASTRUCTURE_READBACK_GREEN'
    ELSE 'INFRASTRUCTURE_READBACK_NOT_ACCEPTED'
  END AS infrastructure_acceptance_state;
