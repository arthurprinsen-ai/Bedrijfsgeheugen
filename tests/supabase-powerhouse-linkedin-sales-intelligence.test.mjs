import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migration = 'supabase/migrations/20260915124500_powerhouse_linkedin_sales_intelligence_v1.sql';

test('Powerhouse LinkedIn sales intelligence closes person company prediction action outcome learning loop', () => {
  assert.equal(existsSync(migration), true, 'LinkedIn sales intelligence migration must exist');
  const sql = readFileSync(migration, 'utf8');

  for (const object of [
    'powerhouse_person_intelligence_v1',
    'powerhouse_company_intelligence_v1',
    'powerhouse_buying_window_v2',
    'powerhouse_commercial_next_best_action_v2',
    'powerhouse_sales_strategy_performance_v1',
    'powerhouse_refresh_linkedin_sales_intelligence_v1'
  ]) assert.match(sql, new RegExp(object, 'i'), `missing ${object}`);

  for (const canonical of [
    'bg_connecties',
    'powerhouse_runtime_events',
    'powerhouse_predictive_signals',
    'powerhouse_opportunities',
    'powerhouse_sales_actions',
    'powerhouse_sales_outcomes',
    'powerhouse_forecasts',
    'powerhouse_forecast_calibration',
    'powerhouse_sales_learnings',
    'powerhouse_content_artifacts'
  ]) assert.match(sql, new RegExp(canonical, 'i'), `must reuse ${canonical}`);

  for (const capability of [
    'relationship_warmth',
    'decision_influence',
    'company_intent_score',
    'buying_window_score',
    'recommended_channel',
    'message_strategy',
    'recommended_asset',
    'recommended_cta',
    'commercial_progression',
    'brier_component',
    'strategy_performance'
  ]) assert.match(sql, new RegExp(capability, 'i'), `missing capability ${capability}`);

  assert.match(sql, /autonomy:'\|\|p_run_date::text\|\|':'\|\|.*opportunity_key/i, 'must reuse canonical action dedupe lineage');
  assert.match(sql, /row_number\(\) over.*<= 20/is, 'must bound daily commercial actions to twenty');
  assert.match(sql, /security_invoker\s*=\s*true/i, 'internal views must use security_invoker');
  assert.match(sql, /set search_path\s*=\s*public/i, 'SECURITY DEFINER function must pin search_path');
  assert.match(sql, /revoke execute on function public\.powerhouse_refresh_linkedin_sales_intelligence_v1/i);
  assert.match(sql, /grant execute on function public\.powerhouse_refresh_linkedin_sales_intelligence_v1.*service_role/i);
  assert.match(sql, /powerhouse-linkedin-sales-intelligence-daily/i, 'must schedule canonical daily refresh');
  assert.doesNotMatch(sql, /create\s+table/i, 'must not create a parallel CRM/intelligence datastore');
  assert.doesNotMatch(sql, /hook\.eu1\.make\.com|make\.com/i, 'must not introduce Make');
});
