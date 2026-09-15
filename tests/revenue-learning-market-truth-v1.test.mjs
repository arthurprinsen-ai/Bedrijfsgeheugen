import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260915184500_powerhouse_market_truth_learning_v1.sql';

const stores = [
  'powerhouse_experiment_assignments',
  'powerhouse_action_economics',
  'powerhouse_human_feedback_events',
];

const views = [
  'powerhouse_causal_experiment_readiness_v1',
  'powerhouse_market_truth_unit_economics_v1',
  'powerhouse_human_feedback_effectiveness_v1',
  'powerhouse_market_truth_health_v1',
];

test('market-truth persistence is first-class and idempotent', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const name of stores) {
    assert.match(sql, new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${name}`, 'i'), `${name} missing`);
    assert.match(sql, new RegExp(`alter\\s+table\\s+public\\.${name}\\s+enable\\s+row\\s+level\\s+security`, 'i'), `${name} must enable RLS`);
    assert.match(sql, new RegExp(`revoke\\s+all\\s+on\\s+public\\.${name}\\s+from\\s+anon\\s*,\\s*authenticated`, 'i'), `${name} must be browser-role revoked`);
  }
  assert.match(sql, /assigned_at/i);
  assert.match(sql, /measurement_horizon_end/i);
  assert.match(sql, /provider_cost_eur/i);
  assert.match(sql, /external_cost_eur/i);
  assert.match(sql, /human_minutes/i);
  assert.match(sql, /recommended_variant/i);
  assert.match(sql, /actual_variant/i);
  assert.match(sql, /dedupe_key/i);
});

test('causal readiness is prospective and fail-closed', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /powerhouse_assign_experiment_v1/i);
  assert.match(sql, /powerhouse_causal_experiment_readiness_v1/i);
  assert.match(sql, /assignment_before_treatment/i);
  assert.match(sql, /not_proven/i);
  assert.match(sql, /insufficient_evidence/i);
  assert.match(sql, /ready_for_estimation/i);
  assert.match(sql, /treatment/i);
  assert.match(sql, /holdout/i);
});

test('market-truth views are service-role only', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const name of views) {
    assert.match(sql, new RegExp(`create\\s+or\\s+replace\\s+view\\s+public\\.${name}`, 'i'), `${name} missing`);
    assert.match(sql, new RegExp(`alter\\s+view\\s+public\\.${name}\\s+set\\s*\\(security_invoker\\s*=\\s*true\\)`, 'i'), `${name} must be security_invoker`);
    assert.match(sql, new RegExp(`revoke\\s+all\\s+on\\s+public\\.${name}\\s+from\\s+anon\\s*,\\s*authenticated`, 'i'), `${name} must be browser-role revoked`);
    assert.match(sql, new RegExp(`grant\\s+select\\s+on\\s+public\\.${name}\\s+to\\s+service_role`, 'i'), `${name} must be service-role readable`);
  }
});

test('daily function preserves historical errors and writes resolution evidence', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /powerhouse_market_truth_daily_v1/i);
  assert.match(sql, /source_health_resolved/i);
  assert.match(sql, /ga4-analytics/i);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.powerhouse_runtime_events/i);
});
