import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260915163000_powerhouse_revenue_intelligence_loop_v1.sql', import.meta.url);
const healthPerfPath = new URL('../supabase/migrations/20260915165500_powerhouse_revenue_intelligence_health_perf_v2.sql', import.meta.url);
const snapshotPath = new URL('../supabase/migrations/20260915170000_powerhouse_revenue_intelligence_snapshot_v1.sql', import.meta.url);
const snapshotFastPath = new URL('../supabase/migrations/20260915170500_powerhouse_revenue_intelligence_snapshot_fast_v2.sql', import.meta.url);
const intelligencePath = new URL('../supabase/functions/powerhouse-revenue-intelligence/index.ts', import.meta.url);

function read(path) { return fs.readFileSync(path, 'utf8'); }

test('migration creates canonical revenue intelligence views', () => {
  const sql = read(migrationPath);
  for (const view of [
    'powerhouse_contact_pressure_v1','powerhouse_account_strategy_v1','powerhouse_research_queue_v1',
    'powerhouse_commercial_next_best_action_v3','powerhouse_revenue_attribution_v1','powerhouse_model_health_v1',
    'powerhouse_experiment_learning_v2','powerhouse_revenue_command_center_v2'
  ]) assert.match(sql, new RegExp(`create\\s+or\\s+replace\\s+view\\s+public\\.${view}`, 'i'), view);
});

test('contact pressure and NBA are fail closed', () => {
  const sql = read(migrationPath);
  assert.match(sql, /cooldown_until/i); assert.match(sql, /pressure_state/i); assert.match(sql, /no_response/i);
  assert.match(sql, /recommended_action/i); assert.match(sql, /'wait'/i); assert.match(sql, /'research'/i); assert.match(sql, /asset_ready/i);
});

test('account strategy includes committee and account thesis', () => {
  const sql = read(migrationPath);
  assert.match(sql, /account_thesis/i); assert.match(sql, /recommended_account_move/i);
  assert.match(sql, /powerhouse_buying_committee_v1/i); assert.match(sql, /powerhouse_company_intelligence_v1/i);
});

test('research queue names missing evidence and reason', () => {
  const sql = read(migrationPath);
  assert.match(sql, /research_reason/i); assert.match(sql, /missing_evidence/i);
  assert.match(sql, /contradiction_detected/i); assert.match(sql, /freshness_state/i);
});

test('attribution distinguishes observed lineage from correlation', () => {
  const sql = read(migrationPath);
  assert.match(sql, /attribution_type/i); assert.match(sql, /'observed'/i); assert.match(sql, /'correlated'/i); assert.match(sql, /attribution_confidence/i);
});

test('model health exposes calibration and classification metrics', () => {
  const sql = read(migrationPath);
  for (const field of ['brier_score','calibration_error','false_positives','false_negatives','sample_size','probability_drift']) assert.match(sql, new RegExp(field, 'i'), field);
  assert.match(sql, /insufficient_evidence/i);
});

test('experiment learning cannot prove itself from vanity metrics only', () => {
  const sql = read(migrationPath);
  assert.match(sql, /commercial_outcomes/i); assert.match(sql, /min_steekproef/i); assert.match(sql, /proven/i);
});

test('health performance fix uses canonical forecast lineage without heavyweight research view', () => {
  const sql = read(healthPerfPath);
  assert.match(sql, /evidence\s*->>\s*'opportunity_key'/i);
  assert.match(sql, /scope\s*=\s*'person'/i);
  assert.match(sql, /scope_key/i);
  assert.doesNotMatch(sql, /from\s+public\.powerhouse_research_queue_v1/i);
  assert.match(sql, /powerhouse_opportunities/i);
});

test('snapshot migration makes the command-center derivation rebuildable and scheduled', () => {
  const sql = read(snapshotPath);
  assert.match(sql, /powerhouse_revenue_command_center_snapshot_v1/i);
  assert.match(sql, /powerhouse_refresh_revenue_intelligence_snapshot_v1/i);
  assert.match(sql, /cron\.schedule/i);
  assert.match(sql, /refreshed_at/i);
  assert.match(sql, /enable row level security/i);
});

test('fast snapshot refresh reuses v2 once and never executes the heavyweight v3 command view', () => {
  const sql = read(snapshotFastPath);
  assert.match(sql, /powerhouse_commercial_next_best_action_v2/i);
  assert.match(sql, /powerhouse_sales_actions/i);
  assert.match(sql, /powerhouse_sales_outcomes/i);
  assert.match(sql, /powerhouse_forecasts/i);
  assert.match(sql, /powerhouse_refresh_revenue_intelligence_snapshot_v1/i);
  assert.doesNotMatch(sql, /from\s+public\.powerhouse_revenue_command_center_v2/i);
  assert.match(sql, /prediction_reply/i);
  assert.match(sql, /prediction_meeting/i);
  assert.match(sql, /prediction_proposal/i);
  assert.match(sql, /prediction_win/i);
  assert.match(sql, /research_reason/i);
  assert.match(sql, /pressure_state/i);
});

test('revenue intelligence facade exposes snapshot-backed command center, account, research and model health routes', () => {
  const source = read(intelligencePath);
  assert.match(source, /command-center/); assert.match(source, /model-health/); assert.match(source, /accounts/); assert.match(source, /research/);
  assert.match(source, /powerhouse_revenue_command_center_snapshot_v1/); assert.match(source, /powerhouse_model_health_v1/); assert.match(source, /x-powerhouse-token/);
});

test('daily intelligence health reports structural lineage gaps, snapshot freshness and explicit degraded state', () => {
  const source = read(intelligencePath);
  assert.match(source, /structural_lineage_gaps/); assert.match(source, /research_queue_count/); assert.match(source, /model_health_segments/); assert.match(source, /degraded/);
  assert.match(source, /snapshot_age_minutes/); assert.match(source, /snapshot_stale/);
});
