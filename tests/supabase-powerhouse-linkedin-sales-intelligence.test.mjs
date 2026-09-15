import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migration = 'supabase/migrations/20260915125500_powerhouse_linkedin_sales_intelligence_v1.sql';

test('Powerhouse LinkedIn sales intelligence closes person company prediction action outcome learning loop', () => {
  assert.equal(existsSync(migration), true, 'LinkedIn sales intelligence migration must exist');
  const sql = readFileSync(migration, 'utf8');
  for (const object of [
    'powerhouse_person_intelligence_v1','powerhouse_company_intelligence_v1','powerhouse_buying_window_v2',
    'powerhouse_commercial_next_best_action_v2','powerhouse_sales_strategy_performance_v1',
    'powerhouse_refresh_linkedin_sales_intelligence_v1'
  ]) assert.match(sql,new RegExp(object,'i'),`missing ${object}`);
  for (const source of [
    'bg_connecties','powerhouse_runtime_events','powerhouse_predictive_signals','powerhouse_opportunities',
    'powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_forecasts','powerhouse_forecast_calibration',
    'powerhouse_sales_learnings','powerhouse_content_artifacts'
  ]) assert.match(sql,new RegExp(source,'i'),`must reuse ${source}`);
  for (const capability of [
    'relationship_warmth','decision_influence','company_intent_score','buying_window_score','recommended_channel',
    'message_strategy','recommended_asset','recommended_cta','commercial_progression','brier_component','strategy_performance'
  ]) assert.match(sql,new RegExp(capability,'i'),`missing ${capability}`);
  assert.match(sql,/expected_value_eur\s*>\s*0[\s\S]*linkedin_dm/i,'direct outreach must require positive observed commercial value');
  assert.match(sql,/autonomy:'\|\|p_run_date::text\|\|':'\|\|r\.opportunity_key/i,'reuse canonical action dedupe lineage');
  assert.match(sql,/where r\.rn <= 20/i,'daily commercial actions must be bounded to 20');
  assert.match(sql,/security_invoker\s*=\s*true/i);
  assert.match(sql,/set search_path\s*=\s*public, pg_catalog/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_refresh_linkedin_sales_intelligence_v1/i);
  assert.match(sql,/powerhouse-linkedin-sales-intelligence-daily/i);
  assert.match(sql,/linkedin-sales-intelligence-fragmentation-v1/i);
  assert.doesNotMatch(sql,/create\s+table/i,'must not create parallel CRM/intelligence datastore');
  assert.doesNotMatch(sql,/hook\.eu1\.make\.com|make\.com/i,'must not introduce Make');
});
