import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const policy = JSON.parse(fs.readFileSync('config/powerhouse-fast-execution-v1.json', 'utf8'));
const continuity = JSON.parse(fs.readFileSync('brain/policies/powerhouse-agent-continuity-v1.json', 'utf8'));
const agents = fs.readFileSync('AGENTS.md', 'utf8');

test('mandatory shared preflight exposes active default fast execution for every material agent/chat entrypoint', () => {
  const packet = compileChatLearningPreflight();
  assert.equal(packet.status, 'READY');
  assert.deepEqual(packet.fastExecution, {
    version: 'POWERHOUSE-FAST-EXECUTION-v1',
    status: 'ACTIVE',
    defaultEnabled: true,
    executionClassDefault: 'STANDARD',
    policySource: 'config/powerhouse-fast-execution-v1.json',
    entrypoint: 'scripts/brain/powerhouse-fast-execution.mjs',
    failClosed: true
  });
  assert.ok(packet.sources.some(source => source.path === 'config/powerhouse-fast-execution-v1.json'));
  assert.ok(packet.fingerprints.includes(policy.fingerprint));
});

test('continuity contract covers current and future agents/chats and points them to the same mandatory preflight', () => {
  assert.equal(continuity.status, 'ACTIVE');
  assert.match(continuity.scope, /all current and future material .*agents, chats/i);
  assert.match(continuity.new_chat_rule, /same mandatory Powerhouse preflight/i);
  assert.match(agents, /node scripts\/brain\/chat-learning-preflight\.mjs/);
});

test('fast execution is an optimization projection and never weakens resilience or production proof', () => {
  assert.equal(policy.default_enabled, true);
  assert.ok(policy.invariants.includes('CANONICAL_INTEGRATION'));
  assert.ok(policy.invariants.includes('NO_SPEED_BY_SKIPPING_GATES'));
  assert.equal(policy.evidence_cache_policy.never_substitutes_required_direct_observation, true);
  assert.match(policy.safety_rule, /interruption-recovery|interruption recovery/i);
  assert.ok(policy.terminal_states.includes('LIVE & BEWEZEN'));
});
