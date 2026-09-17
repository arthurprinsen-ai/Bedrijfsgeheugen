#!/usr/bin/env node
import fs from 'node:fs';

const required = [
  'config/powerhouse-resource-intelligence-v1.json',
  'supabase/migrations/20260917093000_powerhouse_resource_intelligence_v1.sql',
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
for (const token of ['energy_wh','water_ml','energy_provenance','water_provenance','co2e_provenance','powerhouse_compliance_evidence_v1','powerhouse_optimization_candidate_v1','powerhouse_resource_intelligence_daily_v1']) {
  if (!sql.includes(token)) fail(`migration missing ${token}`);
}
if (/energy_wh\s+numeric[^,;]*default\s+0/i.test(sql) || /water_ml\s+numeric[^,;]*default\s+0/i.test(sql)) fail('physical telemetry may not default to zero');

console.log(JSON.stringify({
  status: 'RESOURCE_INTELLIGENCE_READY',
  fingerprint: policy.fingerprint,
  unknown_data_policy: policy.unknown_data_policy,
  production_authority: policy.production_authority,
  daily_learning: policy.daily_learning?.enabled === true
}, null, 2));
