-- Stage 1/2: replace the 36-per-hour, multi-minute scheduler transaction with
-- separate pg_cron transactions. Every v1 task retains its original minute slots.
-- Activate only after source-contract/production acceptance; transaction is atomic.
-- No global cron suspension; cron 171 is replaced at the end of this transaction.
BEGIN;
-- Abort the entire migration if cron job 171 changed since diagnosis.
-- In particular, never unschedule an unrelated production job.
DO $guard$
DECLARE
  v_name text;
  v_command text;
  v_active boolean;
  v_schedule text;
BEGIN
  SELECT jobname,command,active,schedule INTO v_name,v_command,v_active,v_schedule
  FROM cron.job WHERE jobid=171;
  IF NOT FOUND
     OR v_name IS DISTINCT FROM 'powerhouse-runtime-scheduler-mux-v1'
     OR v_command IS DISTINCT FROM 'select public.powerhouse_runtime_scheduler_mux_v3(now());'
     OR v_active IS DISTINCT FROM true
     OR v_schedule IS DISTINCT FROM '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *'
  THEN
    RAISE EXCEPTION 'SCHEDULER_171_DRIFT_ABORT';
  END IF;
END
$guard$;
-- Fail closed before changing any cron schedules if the previously deployed
-- functions expected by the cutover are not present. The migration is atomic.
DO $deps$
DECLARE
  v_missing text[];
  v_name text;
BEGIN
  SELECT array_agg(required_name) INTO v_missing
  FROM (VALUES
    ('powerhouse_runtime_mux_task_v1'),
    ('powerhouse_execution_resilience_watchdog_v1'),
    ('powerhouse_reconciliation_worker_v2'),
    ('powerhouse_public_rls_guard_scan'),
    ('powerhouse_reconcile_daily_sales_action_set_v1'),
    ('powerhouse_content_closed_loop_tick_v1'),
    ('powerhouse_data_spine_watchdog_v1'),
    ('powerhouse_terminal_autonomous_reconcile_v1'),
    ('powerhouse_refresh_loop_assurance_v1'),
    ('powerhouse_email_execution_watchdog_v1'),
    ('powerhouse_one_brain_reconcile_v1'),
    ('powerhouse_refresh_revenue_attribution_snapshot_v1'),
    ('powerhouse_linkedin_oauth_resume_reconcile_v1'),
    ('powerhouse_refresh_regression_stage_evidence_v1'),
    ('powerhouse_refresh_seo_assurance_v1'),
    ('powerhouse_refresh_freshness_contradiction_cache_v1'),
    ('powerhouse_prediction_learning_audit_v2'),
    ('powerhouse_backfill_internal_research_economics_v1'),
    ('powerhouse_backfill_social_learning_applications_v1'),
    ('powerhouse_infinity_operating_loop_v1'),
    ('bg_roep_functie')
  ) AS required(required_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=required.required_name
  );
  IF array_length(v_missing,1)>0 THEN
    RAISE EXCEPTION 'SCHEDULER_CUTOVER_DEPENDENCIES_MISSING: %',array_to_string(v_missing,',');
  END IF;
END
$deps$;
CREATE OR REPLACE FUNCTION public.powerhouse_runtime_scheduler_extras_v4(p_now timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_catalog
AS $fn$
DECLARE
  m integer := extract(minute from p_now)::integer;
  h integer := extract(hour from p_now at time zone 'UTC')::integer;
  v_local timestamp := p_now at time zone 'Europe/Amsterdam';
  v_results jsonb := '[]'::jsonb;
  v_task jsonb;
BEGIN
  IF h=4 AND m=21 THEN
    v_task := public.powerhouse_runtime_mux_task_v1('dataforseo-intelligence',
      'select public.bg_roep_functie(''powerhouse-dataforseo-intelligence'')',8000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  IF h=5 AND m=16 THEN
    v_task := public.powerhouse_runtime_mux_task_v1('gsc-search',
      'select public.bg_roep_functie(''bg-gsc-sync'')',8000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  IF (h=5 AND m IN (31,51)) OR (h=6 AND m=11) THEN
    v_task := public.powerhouse_runtime_mux_task_v1('external-intelligence-bounded',
      'select public.bg_roep_functie(''bg-externe-signalen'')',8000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  IF h=6 AND m=6 THEN
    v_task := public.powerhouse_runtime_mux_task_v1('ga4-analytics',
      'select public.bg_roep_functie(''bg-analytics-sync-composio'')',8000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  IF m=38 THEN
    v_task := public.powerhouse_runtime_mux_task_v1('economics-backfill',
      'select public.powerhouse_backfill_internal_research_economics_v1(now())',8000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  IF m=39 THEN
    v_task := public.powerhouse_runtime_mux_task_v1('social-learning-backfill',
      'select public.powerhouse_backfill_social_learning_applications_v1(now())',8000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  IF extract(hour from v_local)::integer=7
     AND extract(minute from v_local)::integer=41 THEN
    v_task := public.powerhouse_runtime_mux_task_v1('infinity-operating-loop',
      'select public.powerhouse_infinity_operating_loop_v1(null,(now() at time zone ''Europe/Amsterdam'')::date)',10000);
    v_results := v_results || jsonb_build_array(v_task);
  END IF;
  RETURN jsonb_build_object('contract','powerhouse-runtime-scheduler-extras-v4',
    'tasks',v_results,'executed_at',p_now);
END
$fn$;
REVOKE ALL ON FUNCTION public.powerhouse_runtime_scheduler_extras_v4(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_runtime_scheduler_extras_v4(timestamptz) TO postgres;
SELECT cron.schedule('powerhouse-runtime-isolated-execution-resilience-watchdog', '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''execution-resilience-watchdog'', ''select public.powerhouse_execution_resilience_watchdog_v1()'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-reconciliation-worker', '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''reconciliation-worker'', ''select public.powerhouse_reconciliation_worker_v2()'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-public-rls-guard', '1,6,11,16,21,26,31,36,41,46,51,56 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''public-rls-guard'', ''select public.powerhouse_public_rls_guard_scan()'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-daily-action-set-reconcile', '11,26,41,56 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''daily-action-set-reconcile'', ''select public.powerhouse_reconcile_daily_sales_action_set_v1((now() at time zone ''''Europe/Amsterdam'''')::date)'', 10000);');
SELECT cron.schedule('powerhouse-runtime-isolated-content-closed-loop', '4,9,14,19,24,29,34,39,44,49,54,59 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''content-closed-loop'', ''select public.powerhouse_content_closed_loop_tick_v1()'', 10000);');
SELECT cron.schedule('powerhouse-runtime-isolated-data-spine-watchdog', '1,11,21,31,41,51 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''data-spine-watchdog'', ''select public.powerhouse_data_spine_watchdog_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-terminal-autonomous-reconcile', '3,8,13,18,23,28,33,38,43,48,53,58 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''terminal-autonomous-reconcile'', ''select public.powerhouse_terminal_autonomous_reconcile_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-loop-assurance', '14,29,44,59 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''loop-assurance'', ''select public.powerhouse_refresh_loop_assurance_v1(now())'', 10000);');
SELECT cron.schedule('powerhouse-runtime-isolated-email-execution-watchdog', '6,16,26,36,46,56 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''email-execution-watchdog'', ''select public.powerhouse_email_execution_watchdog_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-one-brain-reconcile', '13,43 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''one-brain-reconcile'', ''select public.powerhouse_one_brain_reconcile_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-revenue-attribution-snapshot', '4,19,34,49 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''revenue-attribution-snapshot'', ''select public.powerhouse_refresh_revenue_attribution_snapshot_v1()'', 10000);');
SELECT cron.schedule('powerhouse-runtime-isolated-linkedin-oauth-resume-reconcile', '18,48 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''linkedin-oauth-resume-reconcile'', ''select public.powerhouse_linkedin_oauth_resume_reconcile_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-regression-stage-evidence', '23,53 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''regression-stage-evidence'', ''select public.powerhouse_refresh_regression_stage_evidence_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-seo-assurance', '28,58 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''seo-assurance'', ''select public.powerhouse_refresh_seo_assurance_v1(now())'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-freshness-contradiction-cache', '6,21,36,51 * * * *', 'select public.powerhouse_runtime_mux_task_v1(''freshness-contradiction-cache'', ''select public.powerhouse_refresh_freshness_contradiction_cache_v1()'', 8000);');
SELECT cron.schedule('powerhouse-runtime-isolated-prediction-learning-audit', '4 6 * * *', 'select public.powerhouse_runtime_mux_task_v1(''prediction-learning-audit'', ''select public.powerhouse_prediction_learning_audit_v2()'', 10000);');
-- Cron 171 now runs only the v2/v3 extras at every original special slot.
-- The v1 slots have been moved to the isolated jobs above, without duplication.
SELECT cron.unschedule(171);
SELECT cron.schedule('powerhouse-runtime-extras-v4',
  '6,11,16,21,31,38,39,41,51 * * * *',
  'select public.powerhouse_runtime_scheduler_extras_v4(now());');
COMMIT;
