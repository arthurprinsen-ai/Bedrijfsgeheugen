-- P0 #4198: daily compound learning false-green coverage >100%.
-- Fingerprint: powerhouse|daily-compound-learning|outcome-coverage-denominator-mismatch|20261022-v1
-- Existing schema, scheduler, canonical outcome store and authenticated ACL are retained.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

DO $guard$
BEGIN
  IF to_regclass('public.powerhouse_daily_compound_learning_control_v1') IS NULL
    OR to_regclass('public.powerhouse_sales_actions') IS NULL
    OR to_regclass('public.powerhouse_sales_outcomes') IS NULL
    OR to_regclass('public.powerhouse_forecasts') IS NULL
    OR to_regclass('public.powerhouse_forecast_calibration') IS NULL
    OR to_regclass('public.powerhouse_forecast_resolution_debt_v2') IS NULL
  THEN
    RAISE EXCEPTION 'DAILY_LEARNING_COVERAGE_CANONICAL_SOURCE_MISSING';
  END IF;
END;
$guard$;

CREATE OR REPLACE VIEW public.powerhouse_daily_compound_learning_control_v1
WITH (security_invoker = true) AS
WITH completed_actions AS (
  SELECT
    count(*) FILTER (WHERE lower(status) = 'done')::integer AS executed_actions,
    count(*) FILTER (WHERE lower(status) = 'done' AND outcome_id IS NOT NULL)::integer AS actions_with_outcomes
  FROM public.powerhouse_sales_actions
)
SELECT
  now() AS observed_at,
  a.executed_actions,
  a.actions_with_outcomes,
  (SELECT count(*)::integer FROM public.powerhouse_sales_outcomes) AS observed_outcomes,
  (SELECT count(*)::integer FROM public.powerhouse_forecasts) AS forecasts_total,
  (SELECT count(DISTINCT forecast_id)::integer
   FROM public.powerhouse_forecast_calibration
   WHERE outcome_value IS NOT NULL) AS forecasts_resolved,
  (SELECT count(*)::integer FROM public.powerhouse_forecast_resolution_debt_v2) AS forecast_resolution_debt,
  CASE WHEN a.executed_actions = 0 THEN NULL::numeric
       ELSE round(a.actions_with_outcomes::numeric / a.executed_actions::numeric, 4)
  END AS executed_action_outcome_coverage,
  jsonb_build_object(
    'loop', jsonb_build_array('observe','outcome','memory','resolve','calibrate','learn','next_decision'),
    'verified_outcomes_only', true,
    'auto_negative_resolution', false,
    'parallel_outcome_store', false,
    'parallel_forecast_store', false,
    'coverage_population', 'done_actions_only',
    'coverage_zero_denominator', 'unobserved_not_success'
  ) AS contract
FROM completed_actions a;

-- Explicitly retain the production service-only read boundary.
REVOKE ALL ON TABLE public.powerhouse_daily_compound_learning_control_v1
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.powerhouse_daily_compound_learning_control_v1
  TO service_role;

DO $assert$
DECLARE
  v_done integer;
  v_done_with_outcome integer;
  v_readback record;
BEGIN
  SELECT
    count(*) FILTER (WHERE lower(status) = 'done')::integer,
    count(*) FILTER (WHERE lower(status) = 'done' AND outcome_id IS NOT NULL)::integer
    INTO v_done, v_done_with_outcome
  FROM public.powerhouse_sales_actions;

  SELECT executed_actions, actions_with_outcomes, executed_action_outcome_coverage
    INTO STRICT v_readback
  FROM public.powerhouse_daily_compound_learning_control_v1;

  IF v_readback.executed_actions IS DISTINCT FROM v_done
     OR v_readback.actions_with_outcomes IS DISTINCT FROM v_done_with_outcome
  THEN
    RAISE EXCEPTION 'DAILY_LEARNING_COVERAGE_WRONG_POPULATION';
  END IF;

  IF v_done = 0 THEN
    IF v_readback.executed_action_outcome_coverage IS NOT NULL THEN
      RAISE EXCEPTION 'DAILY_LEARNING_COVERAGE_NO_OBSERVATIONS_FALSE_GREEN';
    END IF;
  ELSIF v_readback.executed_action_outcome_coverage IS DISTINCT FROM
        round(v_done_with_outcome::numeric / v_done::numeric, 4)
  THEN
    RAISE EXCEPTION 'DAILY_LEARNING_COVERAGE_RATIO_MISMATCH';
  END IF;

  IF v_readback.executed_action_outcome_coverage NOT BETWEEN 0 AND 1
  THEN
    RAISE EXCEPTION 'DAILY_LEARNING_COVERAGE_OUTSIDE_UNIT_INTERVAL';
  END IF;

  IF has_table_privilege('anon','public.powerhouse_daily_compound_learning_control_v1','SELECT')
     OR has_table_privilege('authenticated','public.powerhouse_daily_compound_learning_control_v1','SELECT')
     OR NOT has_table_privilege('service_role','public.powerhouse_daily_compound_learning_control_v1','SELECT')
  THEN
    RAISE EXCEPTION 'DAILY_LEARNING_COVERAGE_ACL_DRIFT';
  END IF;
END;
$assert$;
COMMIT;
