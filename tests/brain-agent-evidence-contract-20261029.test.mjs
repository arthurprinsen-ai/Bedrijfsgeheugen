import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateIncidentSelfFix } from '../scripts/brain/chat-learning-preflight.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(rootDir, 'brain/policies/powerhouse-incident-register-and-self-fix-v1.json');
const readPolicy = () => JSON.parse(fs.readFileSync(source, 'utf8'));

test('agent data evolution evidence contract is loaded into existing preflight', () => {
  const result = evaluateIncidentSelfFix({ rootDir, policy: readPolicy() });
  assert.equal(result.lean_loop.runtime_evidence.authority, 'EXISTING_ONE_BRAIN_POWERHOUSE_HEARTBEAT_EXCLUSIVE_WRITER');
  assert.equal(result.lean_loop.runtime_evidence.production_enforcement, 'UNVERIFIED_UNTIL_RUNTIME_PROVIDER_READBACK');
  assert.ok(result.lean_loop.runtime_evidence.provenance_fields.includes('agent_id'));
  assert.ok(result.lean_loop.runtime_evidence.data_quality_states.includes('MISSING'));
});

test('missing SQL-versus-agent identity fails closed', () => {
  const policy = readPolicy();
  policy.continuous_lean_loop.runtime_evidence_contract_v1.actor_kinds = ['agent'];
  assert.throws(() => evaluateIncidentSelfFix({rootDir, policy}), /AGENT_RUNTIME_EVIDENCE_CONTRACT_DRIFT:actor_kinds/);
});

test('removing unknown-not-zero guard fails closed', () => {
  const policy = readPolicy();
  policy.continuous_lean_loop.runtime_evidence_contract_v1.invariant_guards =
    policy.continuous_lean_loop.runtime_evidence_contract_v1.invariant_guards.filter(v => v !== 'UNKNOWN_IS_NOT_ZERO');
  assert.throws(() => evaluateIncidentSelfFix({rootDir, policy}), /AGENT_RUNTIME_EVIDENCE_CONTRACT_DRIFT:invariant_guards/);
});

test('removing portal/documentation protocol fails closed', () => {
  const policy = readPolicy();
  policy.continuous_lean_loop.runtime_evidence_contract_v1.human_documentation_and_portal = [];
  assert.throws(() => evaluateIncidentSelfFix({rootDir, policy}), /AGENT_RUNTIME_EVIDENCE_CONTRACT_INCOMPLETE:human_documentation_and_portal/);
});
