import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915162000_powerhouse_execution_learning_closure_v1.sql', import.meta.url);
const policyUrl = new URL('../brain/policies/powerhouse-revenue-flywheel-v1.json', import.meta.url);
const migration = fs.existsSync(migrationUrl) ? fs.readFileSync(migrationUrl, 'utf8') : '';
const policy = fs.existsSync(policyUrl) ? fs.readFileSync(policyUrl, 'utf8') : '';
const has = (source, pattern, message) => assert.match(source, pattern, message);

test('closure serializes runtime writes instead of racing the closed loop', () => {
  has(migration,/pg_try_advisory_xact_lock/i,'transaction advisory lock is required');
  has(migration,/concurrent_skip/i,'concurrent execution must be explicit');
  has(migration,/powerhouse_commercial_closed_loop_v2/i,'must reuse the canonical commercial closed loop');
});

test('experiment execution is evidence driven', () => {
  has(migration,/social_experiments/i,'must reuse social_experiments');
  has(migration,/bg_post_kenmerken/i,'must reuse experiment-to-post linkage');
  has(migration,/social_posts/i,'must require published-post evidence');
  has(migration,/social_metric_snapshots/i,'must use observed metrics');
  has(migration,/status='ACTIVE'/i,'must support real activation');
  has(migration,/min_steekproef/i,'must respect configured sample floor');
  has(migration,/besluit/i,'must persist evidence-backed decisions');
  has(migration,/never fabricate experiment winner/i,'winner truth boundary is required');
});

test('modeled opportunity economics stay distinct from declared and realized revenue', () => {
  has(migration,/expected_revenue_value/i,'modeled economics must use expected_revenue_value');
  has(migration,/powerhouse_offer_pricing_learning_v1/i,'observed offer/pricing evidence must be reused');
  has(migration,/powerhouse_forecasts/i,'forecast probability/confidence must be reused');
  assert.doesNotMatch(migration,/set\s+expected_value_eur\s*=/i,'declared expected_value_eur must not be overwritten');
  has(migration,/modeled value is not realized revenue/i,'economic truth boundary is required');
});

test('mature forecast calibration reuses the existing calibrator', () => {
  has(migration,/horizon_end\s*</i,'only matured forecasts are eligible');
  has(migration,/powerhouse-forecast-calibrator/i,'must call existing calibrator');
  has(migration,/powerhouse_forecast_calibration/i,'must read canonical calibration table');
});

test('closure is scheduled and writes canonical learning evidence', () => {
  has(migration,/powerhouse-execution-learning-closure-v1/i,'closure contract marker is required');
  has(migration,/47 \* \* \* \*/i,'closure must replace the existing hourly owner at minute 47');
  has(migration,/powerhouse-execution-guard-hourly/i,'old direct scheduler must be replaced');
  has(migration,/powerhouse_runtime_events/i,'runtime evidence is required');
  has(migration,/powerhouse_sales_learnings/i,'learning writeback is required');
  has(migration,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_execution_learning_closure_v1/i,'browser execution must be revoked');
  has(migration,/GRANT EXECUTE ON FUNCTION public\.powerhouse_execution_learning_closure_v1/i,'service role execution must be explicit');
});

test('Powerhouse policy makes closure canonical', () => {
  has(policy,/"version":"v1\.4"/i,'policy must advance to v1.4');
  has(policy,/"execution_learning_closure"/i,'closure capability must be canonical');
  has(policy,/"powerhouse-execution-learning-closure-v1"/i,'closure contract must be recorded');
  has(policy,/"47 \* \* \* \*"/i,'policy must record the canonical scheduler slot');
});