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

test('physical telemetry is nullable and provenance-aware', () => {
  const sql = read(migrationPath);
  assert.match(sql, /energy_wh\s+numeric/i);
  assert.match(sql, /water_ml\s+numeric/i);
  assert.doesNotMatch(sql, /energy_wh\s+numeric[^,;]*default\s+0/i);
  assert.doesNotMatch(sql, /water_ml\s+numeric[^,;]*default\s+0/i);
  for (const field of ['energy_method', 'energy_provenance', 'energy_confidence', 'water_method', 'water_provenance', 'water_confidence', 'co2e_method', 'co2e_provenance', 'co2e_confidence']) {
    assert.match(sql, new RegExp(`\\b${field}\\b`, 'i'));
  }
  assert.match(sql, /powerhouse_resource_intelligence_daily_v1/i);
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
