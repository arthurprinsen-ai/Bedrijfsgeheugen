import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const policyPath = path.join(rootDir, 'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json');
const preflightPath = path.join(rootDir, 'scripts/brain/chat-learning-preflight.mjs');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const preflightSource = fs.readFileSync(preflightPath, 'utf8');

const REQUIRED_INVARIANTS = [
  'NO_AGENT_STARTS_BLIND',
  'NO_MATERIAL_ACTION_WITHOUT_PREFLIGHT_RECEIPT',
  'NO_MATERIAL_ACTION_WITHOUT_ACTIVITY_LEDGER',
  'NO_ERROR_WITHOUT_ROOT_CAUSE_OR_OPEN_ROOT_CAUSE_OBLIGATION',
  'NO_COMPLETION_WITHOUT_CANONICAL_WRITEBACK',
  'NO_COMPLETION_WITHOUT_SHARED_CONTEXT_REFRESH',
  'NO_COMPLETION_UNTIL_NEXT_AGENT_DISCOVERABILITY_IS_PROVEN'
];

test('universal learning/writeback contract remains active and fail-closed', () => {
  assert.equal(policy.status, 'ACTIVE');
  for (const invariant of REQUIRED_INVARIANTS) assert.ok(policy.invariants.includes(invariant), `missing invariant: ${invariant}`);
  assert.equal(policy.mandatory_preflight_receipt.required, true);
  assert.equal(policy.mandatory_activity_ledger.required, true);
  assert.equal(policy.mandatory_postflight_writeback.required, true);
  assert.equal(policy.next_agent_discoverability_gate.required, true);
  assert.equal(policy.terminal_status_gate.production_green_without_writeback, 'NOT_TERMINAL');
  assert.equal(policy.terminal_status_gate.deployment_without_learning, 'NOT_LIVE_BEWEZEN');
});

test('chat-learning preflight cannot silently omit universal learning/writeback policy', () => {
  const relativePolicyPath = 'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json';
  assert.match(preflightSource, new RegExp(relativePolicyPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const packet = compileChatLearningPreflight({ rootDir });
  const source = packet.sources.find(item => item.path === relativePolicyPath);
  assert.ok(source, 'universal learning/writeback policy missing from compiled preflight packet');
  assert.equal(source.fingerprint, policy.fingerprint);
  assert.ok(packet.fingerprints.includes(policy.fingerprint), 'policy fingerprint missing from preflight signals');
});
