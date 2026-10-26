#!/usr/bin/env node
import fs from 'node:fs';

const required = [
  'config/powerhouse-resource-intelligence-v1.json',
  'supabase/migrations/20260917094812_powerhouse_resource_intelligence_v1.sql',
  'tests/powerhouse-resource-intelligence-contract.test.mjs',
  '.github/workflows/powerhouse-resource-intelligence.yml'
];

const fail = (message) => {
  console.error(JSON.stringify({ status: 'RESOURCE_INTELLIGENCE_AUDIT_FAILED', message }));
  process.exit(1);
};

for (const path of required) {
  if (!fs.existsSync(path)) fail(`missing required artifact: ${path}`);
}

const policy = JSON.parse(fs.readFileSync(required[0], 'utf8'));
if (policy.fingerprint !== 'powerhouse-resource-intelligence-v1') fail('invalid fingerprint');
if (policy.unknown_data_policy !== 'null_not_zero') fail('unknown physical telemetry must remain NULL, not zero');
if (policy.production_authority !== 'BG169') fail('BG169 must remain the production authority');
if (policy.provenance_required !== true) fail('provenance must be required');
if (policy.autonomy?.safe_reversible_only !== true) fail('autonomy must be safe/reversible only');
for (const forbidden of ['allow_security_weakening','allow_paid_resource_creation','allow_destructive_irreversible_changes','allow_secrets_or_permission_changes','allow_legal_or_financial_binding_actions']) {
  if (policy.autonomy?.[forbidden] !== false) fail(`${forbidden} must be false`);
}

const sql = fs.readFileSync(required[1], 'utf8');
// These are the actual committed, production-applied September 17 resource
// contracts, shared with the authoritative resource-intelligence test.
for (const token of [
  'powerhouse_resource_impact_v1',
  'powerhouse_action_business_value_v1',
  'powerhouse_resource_intelligence_daily_v1',
  'powerhouse_business_value_intelligence_v1',
  'powerhouse_compliance_evidence_v1',
  'powerhouse_optimization_candidate_v1',
  'energy_kwh', 'water_liters', 'co2e_kg', 'factor_coverage',
  'observed_cost_eur', 'realized_roi', 'provenance_complete',
  'rollback_plan', 'safe_reversible', 'BG169'
]) {
  if (!sql.includes(token)) fail(`canonical migration missing ${token}`);
}
// Unknown measured physical usage stays NULL. Zero is an actual observation,
// never an imputation for an absent provider/resource factor.
if (/\bcoalesce\s*\(\s*(?:energy_kwh|water_liters|co2e_kg)\s*,\s*0\s*\)/i.test(sql) ||
    /\b(?:energy_kwh|water_liters|co2e_kg)\s+numeric[^,;]*\bdefault\s+0\b/i.test(sql))
  fail('physical telemetry may not default to zero');
for (const measure of ['energy_kwh', 'water_liters', 'co2e_kg']) {
  if (!new RegExp(`sum\\(${measure}\\)\\s+filter\\s*\\(where\\s+${measure}\\s+is\\s+not\\s+null\\)`, 'i').test(sql))
    fail(`canonical migration must preserve nullable measure: ${measure}`);
}

console.log(JSON.stringify({
  status: 'RESOURCE_INTELLIGENCE_READY',
  fingerprint: policy.fingerprint,
  unknown_data_policy: policy.unknown_data_policy,
  production_authority: policy.production_authority,
  daily_learning: policy.daily_learning?.enabled === true
}, null, 2));
