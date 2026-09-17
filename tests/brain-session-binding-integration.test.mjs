import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';
import { bindPowerhouseSession, resolveApprovalRequest, verifySessionReceipt } from '../scripts/brain/powerhouse-session-gateway.mjs';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

test('mandatory preflight exposes active fail-closed session binding to every material chat and agent', () => {
  const packet = compileChatLearningPreflight();
  assert.equal(packet.status, 'READY');
  assert.equal(packet.sessionBinding.version, 'POWERHOUSE-SESSION-BINDING-v1');
  assert.equal(packet.sessionBinding.defaultEnabled, true);
  assert.equal(packet.sessionBinding.failClosed, true);
  assert.equal(packet.sessionBinding.entrypoint, 'scripts/brain/powerhouse-session-gateway.mjs');
  assert.equal(packet.sessionBinding.boundState, 'POWERHOUSE_BOUND');
  assert.equal(packet.sessionBinding.unboundState, 'POWERHOUSE_UNBOUND');
  assert.ok(packet.sources.some(source => source.path === 'config/powerhouse-session-binding-v1.json'));
});

test('startup receipt binds preflight, authority, obligations and candidate identity in one reusable proof', () => {
  const packet = compileChatLearningPreflight();
  const receipt = bindPowerhouseSession({
    sessionId: 'integration-chat',
    runId: 'integration-run',
    observedAt: '2026-09-17T11:35:00+02:00',
    preflightPacket: packet,
    authoritySnapshot: { covered: ['POWERHOUSE_OPERATING_RULE','AUTHORIZED_CONTINUATION'], decisions: ['autonomous execution already authorized'] },
    openObligations: [{ id: 'complete-work', state: 'OPEN' }],
    executionClass: 'STANDARD',
    candidateId: 'candidate-1'
  });
  assert.equal(receipt.state, 'POWERHOUSE_BOUND');
  assert.equal(receipt.policyVersions.sessionBinding, 'POWERHOUSE-SESSION-BINDING-v1');
  assert.equal(verifySessionReceipt(receipt, { runId: 'integration-run', candidateId: 'candidate-1' }).ok, true);
});

test('existing authority makes repetitive design approval impossible by contract', async () => {
  const policy = await readJson('config/powerhouse-session-binding-v1.json');
  assert.ok(policy.invariants.includes('NO_USER_APPROVAL_REQUEST_WHEN_EXISTING_AUTHORITY_COVERS_DECISION'));
  assert.equal(resolveApprovalRequest({ decisionClass: 'EXISTING_ARCHITECTURE' }).action, 'CONTINUE_AUTONOMOUSLY');
  assert.equal(resolveApprovalRequest({ decisionClass: 'AUTHORIZED_CONTINUATION' }).action, 'CONTINUE_AUTONOMOUSLY');
  assert.equal(resolveApprovalRequest({ decisionClass: 'GENUINELY_NEW_UNRESOLVED_CHOICE' }).action, 'ASK_USER');
});

test('unbound context is explicitly not governance', async () => {
  const policy = await readJson('config/powerhouse-session-binding-v1.json');
  assert.equal(policy.unbound_state, 'POWERHOUSE_UNBOUND');
  assert.equal(policy.bound_state, 'POWERHOUSE_BOUND');
  assert.ok(policy.invariants.includes('NO_CONTEXT_ONLY_GOVERNANCE'));
});
