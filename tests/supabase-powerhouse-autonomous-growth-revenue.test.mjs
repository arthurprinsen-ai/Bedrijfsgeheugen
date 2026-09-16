import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migration = 'supabase/migrations/20260915102925_powerhouse_autonomous_growth_revenue_v1.sql';

test('Powerhouse autonomous growth revenue cycle reuses canonical lineage and gates daily green', () => {
  assert.equal(existsSync(migration), true, 'autonomous growth/revenue migration must exist');
  const sql = readFileSync(migration, 'utf8');

  assert.match(sql, /powerhouse_autonomous_growth_revenue_cycle/i);
  assert.match(sql, /powerhouse_predictive_signals/i);
  assert.match(sql, /powerhouse_forecasts/i);
  assert.match(sql, /powerhouse_opportunities/i);
  assert.match(sql, /powerhouse_sales_actions/i);
  assert.match(sql, /powerhouse_sales_outcomes/i);
  assert.match(sql, /powerhouse_sales_learnings/i);
  assert.match(sql, /powerhouse_content_recommendations/i);
  assert.match(sql, /powerhouse_daily_runs/i);

  for (const capability of [
    'next_best_action',
    'buying_window',
    'latent_problem',
    'offer_problem_match',
    'content_outcome_model',
    'memeability',
    'creative_evolution',
    'causal_learning',
    'counterfactual',
    'commercial_world_model',
    'revenue_attribution',
    'research_strategy',
    'self_improvement'
  ]) {
    assert.match(sql, new RegExp(capability, 'i'), `missing capability ${capability}`);
  }

  assert.match(sql, /powerhouse_daily_execution_guard/i);
  assert.match(sql, /autonomous_growth_revenue/i);
  assert.match(sql, /and coalesce\(\(autonomy->>'healthy'\)::boolean,false\)/i);
  assert.match(sql, /brain_failure_registry/i);
  assert.doesNotMatch(sql, /create\s+table\s+.*autonomous/i, 'must not create a parallel autonomy datastore');
});
