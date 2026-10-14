-- Emergency rollback only; intentionally outside supabase/migrations.
-- Manually apply only after readback shows runtime mux cutover is responsible.
-- Transactional restore of prior scheduler then retire isolated tasks.
BEGIN;
DO $guard$
DECLARE v_command text;
BEGIN
 SELECT command INTO v_command FROM cron.job
 WHERE jobname='powerhouse-runtime-scheduler-mux-v1' AND active;
 IF FOUND AND v_command IS DISTINCT FROM
   'select public.powerhouse_runtime_scheduler_mux_v3(now());' THEN
   RAISE EXCEPTION 'REFUSE_ROLLBACK_UNKNOWN_SCHEDULER_OWNER';
 END IF;
END
$guard$;
SELECT cron.schedule(
 'powerhouse-runtime-scheduler-mux-v1',
 '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *',
 'select public.powerhouse_runtime_scheduler_mux_v3(now());'
);
-- Check names and commands before deletion; abort if any owner has changed.
DO $guard$
DECLARE v_name text; v_command text;
BEGIN
 FOR v_name,v_command IN
   SELECT jobname, command FROM cron.job WHERE jobname IN (
     'powerhouse-runtime-isolated-execution-resilience-watchdog',
     'powerhouse-runtime-isolated-reconciliation-worker',
     'powerhouse-runtime-isolated-public-rls-guard',
     'powerhouse-runtime-isolated-daily-action-set-reconcile',
     'powerhouse-runtime-isolated-content-closed-loop',
     'powerhouse-runtime-isolated-data-spine-watchdog',
     'powerhouse-runtime-isolated-terminal-autonomous-reconcile',
     'powerhouse-runtime-isolated-loop-assurance',
     'powerhouse-runtime-isolated-email-execution-watchdog',
     'powerhouse-runtime-isolated-one-brain-reconcile',
     'powerhouse-runtime-isolated-revenue-attribution-snapshot',
     'powerhouse-runtime-isolated-linkedin-oauth-resume-reconcile',
     'powerhouse-runtime-isolated-regression-stage-evidence',
     'powerhouse-runtime-isolated-seo-assurance',
     'powerhouse-runtime-isolated-freshness-contradiction-cache',
     'powerhouse-runtime-isolated-prediction-learning-audit',
     'powerhouse-runtime-extras-v4',
     'powerhouse-operational-retry-worker'
   )
 LOOP
   IF v_name='powerhouse-runtime-extras-v4' AND
      v_command NOT LIKE 'select public.powerhouse_runtime_scheduler_extras_v4(%'
   THEN RAISE EXCEPTION 'ROLLBACK_OWNER_DRIFT:%',v_name; END IF;
   IF v_name='powerhouse-operational-retry-worker' AND
      v_command NOT LIKE 'select powerhouse_ops.replay_operational_failures_v1(%'
   THEN RAISE EXCEPTION 'ROLLBACK_OWNER_DRIFT:%',v_name; END IF;
   IF v_name LIKE 'powerhouse-runtime-isolated-%' AND
      v_command NOT LIKE 'select public.powerhouse_runtime_mux_task_v1(%' AND
      v_command NOT LIKE 'select public.powerhouse_refresh_revenue_attribution_incremental_v1(%' AND
      v_command NOT LIKE 'select powerhouse_ops.run_operational_task_v1(%'
   THEN RAISE EXCEPTION 'ROLLBACK_OWNER_DRIFT:%',v_name; END IF;
 END LOOP;
END
$guard$;
DO $retire$
DECLARE v_name text;
BEGIN
 FOR v_name IN
   SELECT jobname FROM cron.job WHERE jobname IN (
     'powerhouse-runtime-isolated-execution-resilience-watchdog',
     'powerhouse-runtime-isolated-reconciliation-worker',
     'powerhouse-runtime-isolated-public-rls-guard',
     'powerhouse-runtime-isolated-daily-action-set-reconcile',
     'powerhouse-runtime-isolated-content-closed-loop',
     'powerhouse-runtime-isolated-data-spine-watchdog',
     'powerhouse-runtime-isolated-terminal-autonomous-reconcile',
     'powerhouse-runtime-isolated-loop-assurance',
     'powerhouse-runtime-isolated-email-execution-watchdog',
     'powerhouse-runtime-isolated-one-brain-reconcile',
     'powerhouse-runtime-isolated-revenue-attribution-snapshot',
     'powerhouse-runtime-isolated-linkedin-oauth-resume-reconcile',
     'powerhouse-runtime-isolated-regression-stage-evidence',
     'powerhouse-runtime-isolated-seo-assurance',
     'powerhouse-runtime-isolated-freshness-contradiction-cache',
     'powerhouse-runtime-isolated-prediction-learning-audit',
     'powerhouse-runtime-extras-v4',
     'powerhouse-operational-retry-worker'
   )
 LOOP
   PERFORM cron.unschedule(v_name);
 END LOOP;
END
$retire$;
COMMIT;
-- Post-deployment checks (separate read-only query):
-- SELECT jobid,jobname,active,schedule FROM cron.job
-- WHERE jobname='powerhouse-runtime-scheduler-mux-v1'
-- OR jobname LIKE 'powerhouse-runtime-isolated-%';
