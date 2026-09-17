import test from 'node:test';
import assert from 'node:assert/strict';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

test('mandatory chat preflight exposes Fast Development Protocol v2 as current authority', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'inspect current deploy status' } });
  assert.equal(packet.status, 'READY');
  assert.equal(packet.fastExecution.fingerprint, 'powerhouse-fast-development-protocol-v2');
  assert.deepEqual(packet.fastExecution.executionClasses, ['FAST','STANDARD','CRITICAL','WAITING_EXTERNAL']);
  assert.deepEqual(packet.fastExecution.canonicalFlow, ['INTENT','EXECUTION_PACKET_V2','NO_OP_DEDUP','IMPACT_GRAPH','EXECUTION_DAG','TARGETED_TESTS','CANDIDATE','FULL_RELEASE_GATES','EXACT_SHA_PROD_READBACK','DELTA_WRITEBACK']);
  assert.equal(packet.fastExecution.noOpBeforeReasoning, true);
  assert.equal(packet.fastExecution.fullReleaseGatesAtPromotionBoundary, true);
  assert.equal(packet.fastExecution.persistenceAuthority, 'brain_outcome_obligation_evidence');
  assert.equal(packet.legacyFastExecution.version, 'POWERHOUSE-FAST-EXECUTION-v1');
});

test('chat preflight automatically creates fail-closed Execution Packet v2 when identity is unavailable', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'fix portal spacing' } });
  assert.equal(packet.execution_packet_v2.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(packet.execution_packet_v2.fallback.fail_closed, true);
  assert.equal(packet.execution_packet_v2.fallback.route, 'FULL_CANONICAL_PREFLIGHT');
  assert.deepEqual(packet.execution_packet_v2.fallback.missing.sort(), ['current_state_id','last_verified_sha','last_verified_state_id','main_sha']);
});

test('chat preflight carries exact supplied identity without fallback', () => {
  const packet = compileChatLearningPreflight({ executionContext: {
    taskId: 'task-1', intent: 'fix portal spacing', mainSha: 'main-sha', lastVerifiedSha: 'verified-sha',
    lastVerifiedStateId: 'state-1', currentStateId: 'state-2', componentIds: ['portal'], deliveryLanes: ['portal'],
    changedPaths: ['portal-v2/a.css'], resourceRefs: ['portal-v2/a.css'], requiredGates: ['required'],
    configDigest: 'cfg', schemaDigest: 'schema', dependencyDigest: 'dep', testPolicyDigest: 'tests'
  } });
  assert.equal(packet.execution_packet_v2.main_sha, 'main-sha');
  assert.equal(packet.execution_packet_v2.last_verified_sha, 'verified-sha');
  assert.equal('fallback' in packet.execution_packet_v2, false);
});

test('preflight telemetry reports observed startup timings and never fabricates unobserved stages', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'status readback' } });
  assert.equal(typeof packet.telemetry.context_load_ms, 'number');
  assert.equal(typeof packet.telemetry.classification_ms, 'number');
  assert.equal(typeof packet.telemetry.total_preflight_ms, 'number');
  for (const key of ['reasoning_ms','tool_ms','targeted_test_ms','full_gate_ms','deploy_ms','proof_ms','writeback_ms']) assert.equal(packet.telemetry[key], null, key);
  assert.equal(packet.telemetry.unobserved, true);
});
