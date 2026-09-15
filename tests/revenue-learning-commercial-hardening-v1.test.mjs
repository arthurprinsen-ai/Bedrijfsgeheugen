import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260915183000_powerhouse_commercial_learning_hardening_v1.sql';

const requiredViews = [
  'powerhouse_counterfactual_candidate_v1',
  'powerhouse_unit_economics_v1',
  'powerhouse_customer_expansion_v1',
  'powerhouse_lost_deal_intelligence_v1',
  'powerhouse_competitor_intelligence_v1',
  'powerhouse_provider_health_v1',
  'powerhouse_human_feedback_learning_v1',
  'powerhouse_revenue_truth_v1',
  'powerhouse_decision_explainability_v1',
  'powerhouse_capacity_guard_v1',
];

test('commercial learning hardening migration exists with all canonical views', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const view of requiredViews) {
    assert.match(sql, new RegExp(`create\\s+or\\s+replace\\s+view\\s+public\\.${view}`, 'i'), `${view} missing`);
    assert.match(sql, new RegExp(`alter\\s+view\\s+public\\.${view}\\s+set\\s*\\(security_invoker\\s*=\\s*true\\)`, 'i'), `${view} must be security_invoker`);
    assert.match(sql, new RegExp(`revoke\\s+all\\s+on\\s+public\\.${view}\\s+from\\s+anon\\s*,\\s*authenticated`, 'i'), `${view} must be browser-role revoked`);
    assert.match(sql, new RegExp(`grant\\s+select\\s+on\\s+public\\.${view}\\s+to\\s+service_role`, 'i'), `${view} must be service-role only`);
  }
});

test('counterfactual candidates are explicitly prospective and not causal proof', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /prospective_holdout_candidate/i);
  assert.match(sql, /causal_status/i);
  assert.match(sql, /not_proven/i);
});

test('revenue truth separates forecast, attribution and realized revenue', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /forecast_revenue_eur/i);
  assert.match(sql, /attributed_revenue_eur/i);
  assert.match(sql, /realized_revenue_eur/i);
});

test('human feedback treats skipped or cancelled recommendations as learnable evidence', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /status\s+in\s*\(\s*'skipped'\s*,\s*'cancelled'\s*\)/i);
  assert.match(sql, /human_feedback_state/i);
});

test('existing pricing and freshness capabilities are reused instead of duplicated', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /powerhouse_offer_pricing_learning_v1/i);
  assert.match(sql, /powerhouse_source_freshness_v1/i);
});
