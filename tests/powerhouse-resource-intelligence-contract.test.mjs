import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260917093000_powerhouse_resource_intelligence_v1.sql';
const configPath = 'config/powerhouse-resource-intelligence-v1.json';
const workflowPath = '.github/workflows/powerhouse-resource-intelligence.yml';
const auditPath = 'scripts/brain/resource-intelligence-audit.mjs';
const agentContractPath = 'brain/contracts/resource-intelligence-v1.json';

function read(path) {
  assert.ok(fs.existsSync(path), `missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}

test('resource intelligence composes canonical production views without mutating them', () => {
  const sql = read(migrationPath);
  assert.doesNotMatch(sql, /alter\s+table\s+public\.powerhouse_resource_impact_v1/i);
  assert.match(sql, /from\s+public\.powerhouse_resource_impact_v1/i);
  assert.match(sql, /from\s+public\.powerhouse_action_business_value_v1/i);
  assert.match(sql, /energy_kwh/i);
  assert.match(sql, /water_liters/i);
  assert.match(sql, /co2e_kg/i);
  assert.match(sql, /factor_coverage/i);
  assert.match(sql, /observed_cost_eur/i);
  assert.match(sql, /realized_roi/i);
  assert.match(sql, /powerhouse_resource_intelligence_daily_v1/i);
  assert.match(sql, /powerhouse_business_value_intelligence_v1/i);
});

test('unknown physical telemetry stays unknown and provenance-aware', () => {
  const sql = read(migrationPath);
  assert.match(sql, /sum\(energy_kwh\)\s+filter\s*\(where energy_kwh is not null\)/i);
  assert.match(sql, /sum\(water_liters\)\s+filter\s*\(where water_liters is not null\)/i);
  assert.match(sql, /sum\(co2e_kg\)\s+filter\s*\(where co2e_kg is not null\)/i);
  assert.match(sql, /min\(confidence\)\s+filter\s*\(where factor_id is not null\)/i);
  assert.doesNotMatch(sql, /coalesce\(energy_kwh\s*,\s*0\)/i);
  assert.doesNotMatch(sql, /coalesce\(water_liters\s*,\s*0\)/i);
  assert.doesNotMatch(sql, /coalesce\(co2e_kg\s*,\s*0\)/i);
});

test('compliance evidence and optimization remain evidence- and safety-bounded', () => {
  const sql = read(migrationPath);
  assert.match(sql, /create table if not exists public\.powerhouse_compliance_evidence_v1/i);
  assert.match(sql, /evidence_missing/i);
  assert.match(sql, /review_required/i);
  assert.match(sql, /create table if not exists public\.powerhouse_optimization_candidate_v1/i);
  assert.match(sql, /safe_reversible/i);
  assert.match(sql, /rollback_plan/i);
  assert.match(sql, /measured_outcome/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /service_role/i);
});

test('machine-readable policy is null-not-zero and subordinate to existing production authority', () => {
  const config = JSON.parse(read(configPath));
  assert.equal(config.fingerprint, 'powerhouse-resource-intelligence-v1');
  assert.equal(config.unknown_data_policy, 'null_not_zero');
  assert.equal(config.production_authority, 'BG169');
  assert.equal(config.provenance_required, true);
  assert.equal(config.daily_learning.enabled, true);
  assert.equal(config.autonomy.safe_reversible_only, true);
  assert.equal(config.autonomy.allow_security_weakening, false);
  assert.equal(config.autonomy.allow_paid_resource_creation, false);
  assert.equal(config.autonomy.allow_destructive_irreversible_changes, false);
});

test('daily autonomous opportunity generation is idempotent and authority-bounded', () => {
  const sql = read(migrationPath);
  assert.match(sql, /powerhouse_generate_resource_optimization_candidates_v1/i);
  assert.match(sql, /on conflict \(source_key\) do nothing/i);
  assert.match(sql, /powerhouse-resource-intelligence-daily-v1/i);
  assert.match(sql, /cron\.schedule/i);
  assert.match(sql, /BG169/);
  assert.match(sql, /expected impact expresses direction only, not an invented savings claim/i);
});

test('daily workflow and deterministic audit are wired', () => {
  const workflow = read(workflowPath);
  const audit = read(auditPath);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /resource-intelligence-audit\.mjs --check/);
  assert.match(workflow, /powerhouse-resource-intelligence-contract\.test\.mjs/);
  assert.match(audit, /null_not_zero/);
  assert.match(audit, /BG169/);
});

test('all-agent Brain contract is explicit, mandatory in preflight and closed-loop', () => {
  const contract = JSON.parse(read(agentContractPath));
  const preflight = read('scripts/brain/chat-learning-preflight.mjs');
  assert.equal(contract.$id, 'BRAIN-RESOURCE-INTELLIGENCE-v1');
  assert.match(contract.scope, /all_current_and_future_agents_chats_workflows_and_apps/);
  assert.equal(contract.authority.production, 'BG169');
  assert.ok(contract.decision_rules.includes('unknown_energy_or_water_is_NULL_not_zero'));
  assert.equal(contract.daily_cycle.enabled, true);
  assert.ok(contract.after_outcome.includes('refresh_shared_context'));
  assert.match(preflight, /brain\/contracts\/resource-intelligence-v1\.json/);
});
