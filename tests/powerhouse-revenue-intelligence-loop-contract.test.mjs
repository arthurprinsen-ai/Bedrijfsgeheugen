import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260915163000_powerhouse_revenue_intelligence_loop_v1.sql', import.meta.url);
const runtimePath = new URL('../supabase/functions/powerhouse-runtime/index.ts', import.meta.url);

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('migration creates canonical revenue intelligence views', () => {
  const sql = read(migrationPath);
  for (const view of [
    'powerhouse_contact_pressure_v1',
    'powerhouse_account_strategy_v1',
    'powerhouse_research_queue_v1',
    'powerhouse_commercial_next_best_action_v3',
    'powerhouse_revenue_attribution_v1',
    'powerhouse_model_health_v1',
    'powerhouse_experiment_learning_v2',
    'powerhouse_revenue_command_center_v2'
  ]) assert.match(sql, new RegExp(`create\\s+or\\s+replace\\s+view\\s+public\\.${view}`, 'i'), view);
});

test('contact pressure and NBA are fail closed', () => {
  const sql = read(migrationPath);
  assert.match(sql, /cooldown_until/i);
  assert.match(sql, /pressure_state/i);
  assert.match(sql, /no_response/i);
  assert.match(sql, /recommended_action/i);
  assert.match(sql, /'wait'/i);
  assert.match(sql, /'research'/i);
  assert.match(sql, /asset_ready/i);
});

test('account strategy includes committee and account thesis', () => {
  const sql = read(migrationPath);
  assert.match(sql, /account_thesis/i);
  assert.match(sql, /recommended_account_move/i);
  assert.match(sql, /powerhouse_buying_committee_v1/i);
  assert.match(sql, /powerhouse_company_intelligence_v1/i);
});

test('research queue names missing evidence and reason', () => {
  const sql = read(migrationPath);
  assert.match(sql, /research_reason/i);
  assert.match(sql, /missing_evidence/i);
  assert.match(sql, /contradiction_detected/i);
  assert.match(sql, /freshness_state/i);
});

test('attribution distinguishes observed lineage from correlation', () => {
  const sql = read(migrationPath);
  assert.match(sql, /attribution_type/i);
  assert.match(sql, /'observed'/i);
  assert.match(sql, /'correlated'/i);
  assert.match(sql, /attribution_confidence/i);
});

test('model health exposes calibration and classification metrics', () => {
  const sql = read(migrationPath);
  for (const field of ['brier_score','calibration_error','false_positives','false_negatives','sample_size','probability_drift']) {
    assert.match(sql, new RegExp(field, 'i'), field);
  }
  assert.match(sql, /insufficient_evidence/i);
});

test('experiment learning cannot prove itself from vanity metrics only', () => {
  const sql = read(migrationPath);
  assert.match(sql, /commercial_outcomes/i);
  assert.match(sql, /min_steekproef/i);
  assert.match(sql, /proven/i);
});

test('runtime exposes command center, account, research and model health routes', () => {
  const source = read(runtimePath);
  assert.match(source, /command-center/);
  assert.match(source, /model-health/);
  assert.match(source, /accounts/);
  assert.match(source, /research/);
  assert.match(source, /powerhouse_revenue_command_center_v2/);
  assert.match(source, /powerhouse_model_health_v1/);
});

test('daily runtime reports structural lineage gaps and explicit degraded state', () => {
  const source = read(runtimePath);
  assert.match(source, /structural_lineage_gaps/);
  assert.match(source, /research_queue_count/);
  assert.match(source, /model_health_segments/);
  assert.match(source, /degraded/);
});
