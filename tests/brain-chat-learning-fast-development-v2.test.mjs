import test from 'node:test';
import assert from 'node:assert/strict';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';
import { selectSkillProjection } from '../scripts/brain/powerhouse-skill-projection.mjs';

test('Fast Development v2 is the current chat/agent preflight authority', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'inspect current deploy status' } });
  assert.equal(packet.version, 'BRAIN-CHAT-LEARNING-PREFLIGHT-v2');
  assert.equal(packet.status, 'READY');
  assert.equal(packet.fastExecution.fingerprint, 'powerhouse-fast-development-protocol-v2');
  assert.deepEqual(packet.fastExecution.executionClasses, ['FAST','STANDARD','CRITICAL','WAITING_EXTERNAL']);
  assert.equal(packet.fastExecution.noOpBeforeReasoning, true);
  assert.equal(packet.fastExecution.fullReleaseGatesAtPromotionBoundary, true);
  assert.equal(packet.fastExecution.persistenceAuthority, 'brain_outcome_obligation_evidence');
  assert.equal(packet.legacyFastExecution.version, 'POWERHOUSE-FAST-EXECUTION-v1');
  assert.equal(packet.legacyFastExecution.compatibilityOnly, true);
});

test('v2 fails closed to canonical preflight when exact identity is unavailable', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'fix portal spacing' } });
  assert.equal(packet.execution_packet_v2.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(packet.execution_packet_v2.fallback.fail_closed, true);
  assert.equal(packet.execution_packet_v2.fallback.route, 'FULL_CANONICAL_PREFLIGHT');
  assert.deepEqual(packet.execution_packet_v2.fallback.missing.sort(), ['current_state_id','last_verified_sha','last_verified_state_id','main_sha']);
});

test('v2 carries exact supplied identity without fallback', () => {
  const packet = compileChatLearningPreflight({ executionContext: {
    taskId: 'task-1',
    intent: 'fix portal spacing',
    mainSha: 'main-sha',
    lastVerifiedSha: 'verified-sha',
    lastVerifiedStateId: 'state-1',
    currentStateId: 'state-2',
    componentIds: ['portal'],
    deliveryLanes: ['portal'],
    changedPaths: ['portal-v2/a.css'],
    resourceRefs: ['portal-v2/a.css'],
    requiredGates: ['required'],
    configDigest: 'cfg',
    schemaDigest: 'schema',
    dependencyDigest: 'dep',
    testPolicyDigest: 'tests'
  } });
  assert.equal(packet.execution_packet_v2.main_sha, 'main-sha');
  assert.equal(packet.execution_packet_v2.last_verified_sha, 'verified-sha');
  assert.equal('fallback' in packet.execution_packet_v2, false);
});

test('Universal Ingress remains mandatory while v2 is active', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'status readback' } });
  assert.equal(packet.universalIngress.version, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
  assert.equal(packet.universalIngress.status, 'ACTIVE');
  assert.equal(packet.universalIngress.failClosed, true);
  assert.ok(packet.universalIngress.actorKinds.includes('chat'));
  assert.ok(packet.universalIngress.actorKinds.includes('agent'));
});

test('preflight telemetry reports observed startup timings without fabricated downstream timings', () => {
  const packet = compileChatLearningPreflight({ executionContext: { intent: 'status readback' } });
  assert.equal(typeof packet.telemetry.context_load_ms, 'number');
  assert.equal(typeof packet.telemetry.classification_ms, 'number');
  assert.equal(typeof packet.telemetry.total_preflight_ms, 'number');
  for (const key of ['reasoning_ms','tool_ms','targeted_test_ms','full_gate_ms','deploy_ms','proof_ms','writeback_ms']) {
    assert.equal(packet.telemetry[key], null, key);
  }
  assert.equal(packet.telemetry.unobserved, true);
});

test('Dutch portal intent retrieves relevant canonical learning plus mandatory prevention', () => {
  const entries = [
    { fingerprint: 'mandatory', mandatory_preflight: true, skill_targets: ['continuity'] },
    { fingerprint: 'portal-fix', skill_targets: ['portal'], sources: ['brain/learning/portal-fix.json'] },
    { fingerprint: 'security-fix', skill_targets: ['security'], sources: ['brain/learning/security-fix.json'] }
  ];
  const index = { entries, entry_count: entries.length, projection_digest: 'canonical' };
  const result = selectSkillProjection(index, { intent: 'Verbeter het klantportaal voor ondernemers' });
  assert.deepEqual(result.selected_entries.map(x => x.fingerprint), ['mandatory','portal-fix']);
  assert.ok(result.retrieval_evidence.inferred_targets.includes('portal'));
  assert.equal(result.retrieval_evidence.status, 'COMPLETE_FOR_MATCHED_HINTS');
  assert.equal(result.retrieval_evidence.interpretation, 'retrieved_not_applied_or_outcome_verified');
  assert.deepEqual(selectSkillProjection(index).selected_entries.map(x => x.fingerprint), ['mandatory']);
});

test('bounded implicit retrieval leaves visible debt and never drops explicit learning', () => {
  const entries = [
    { fingerprint: 'mandatory', mandatory_preflight: true, skill_targets: ['continuity'] },
    ...Array.from({length:17}, (_, i) => ({
      fingerprint: 'portal-lesson-' + String(i).padStart(2,'0'),
      skill_targets: ['portal'], sources: ['brain/learning/portal-lesson.json']
    }))
  ];
  const result = selectSkillProjection({entries,entry_count:18,projection_digest:'fixture'}, {
    intent: 'Fix portaal', fingerprints: ['portal-lesson-16','not-found']
  });
  assert.ok(result.selected_entries.some(x => x.fingerprint === 'portal-lesson-16'));
  assert.equal(result.retrieval_evidence.inferred_loaded_count, 12);
  assert.equal(result.retrieval_evidence.deferred_count, 4);
  assert.deepEqual(result.retrieval_evidence.unresolved_explicit_fingerprints, ['not-found']);
  assert.equal(result.retrieval_evidence.status, 'PARTIAL_REQUIRES_TARGETED_RETRIEVAL');
});

test('agent preflight forwards intent to task-scoped skill reuse', () => {
  const packet = compileChatLearningPreflight({executionContext:{intent:'Verbeter het portaal voor klanten'}});
  assert.ok(packet.skill_projection.selection.retrieval_evidence.inferred_targets.includes('portal'));
});
