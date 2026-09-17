import test from 'node:test';
import assert from 'node:assert/strict';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

test('mandatory chat-learning preflight automatically emits Fast Development Protocol v2 session envelope', () => {
  const packet = compileChatLearningPreflight({
    executionContext: {
      taskId: 'chat-session-regression',
      intent: 'verify automatic v2 preflight wiring',
      mainSha: 'main-sha',
      lastVerifiedSha: 'verified-sha',
      lastVerifiedStateId: 'state-before',
      currentStateId: 'state-now',
      componentIds: ['brain-chat-learning'],
      deliveryLanes: ['brain'],
      requiredGates: ['test'],
      configDigest: 'cfg',
      schemaDigest: 'schema',
      dependencyDigest: 'deps',
      testPolicyDigest: 'tests'
    }
  });

  assert.equal(packet.status, 'READY');
  assert.equal(packet.fastDevelopment.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(packet.fastDevelopment.execution_packet.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(packet.fastDevelopment.execution_packet.task_id, 'chat-session-regression');
  assert.equal(packet.fastDevelopment.execution_packet.main_sha, 'main-sha');
  assert.equal(packet.fastDevelopment.execution_packet.fallback, undefined);
  assert.equal(packet.fastDevelopment.telemetry_session.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(packet.fastDevelopment.telemetry_session.task_id, 'chat-session-regression');
  for (const key of ['context_load_ms','classification_ms','reasoning_ms','tool_ms','targeted_test_ms','full_gate_ms','deploy_ms','proof_ms','writeback_ms','total_lead_time_ms']) {
    assert.equal(typeof packet.fastDevelopment.telemetry_session.metrics[key], 'number', key);
  }
});

test('automatic v2 execution packet fails closed when canonical state identity is unavailable', () => {
  const packet = compileChatLearningPreflight({
    executionContext: {
      taskId: 'chat-session-unknown-state',
      intent: 'inspect current state'
    }
  });

  assert.equal(packet.fastDevelopment.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(packet.fastDevelopment.execution_packet.main_sha, null);
  assert.equal(packet.fastDevelopment.execution_packet.last_verified_sha, null);
  assert.equal(packet.fastDevelopment.execution_packet.fallback.fail_closed, true);
  assert.equal(packet.fastDevelopment.execution_packet.fallback.route, 'FULL_CANONICAL_PREFLIGHT');
  assert.deepEqual(packet.fastDevelopment.execution_packet.fallback.missing.sort(), [
    'current_state_id',
    'last_verified_sha',
    'last_verified_state_id',
    'main_sha'
  ]);
});
