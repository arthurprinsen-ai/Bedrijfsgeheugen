import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindPowerhouseSession,
  verifySessionReceipt,
  resolveApprovalRequest,
  assertApprovalRequestAllowed,
  RECEIPT_VERSION,
} from '../scripts/brain/powerhouse-session-gateway.mjs';

const preflight = {
  status: 'READY',
  fastExecution: { version: 'POWERHOUSE-FAST-EXECUTION-v1' },
  universalCompletion: { version: 'POWERHOUSE-UNIVERSAL-COMPLETION-v1' },
  sessionBinding: { version: 'POWERHOUSE-SESSION-BINDING-v1' },
  sources: [{ path: 'brain/current-state.json', sha256: 'abc' }],
  fingerprints: ['known-learning'],
  preventions: ['reuse first'],
  blockers: [],
  resume_contracts: [],
};

test('material Powerhouse run receives a deterministic bound receipt', () => {
  const receipt = bindPowerhouseSession({
    sessionId: 'chat-1',
    runId: 'run-1',
    observedAt: '2026-09-17T11:30:00+02:00',
    preflightPacket: preflight,
    authoritySnapshot: { covered: ['EXISTING_ARCHITECTURE'] },
    openObligations: [{ id: 'o-1', state: 'OPEN' }],
    executionClass: 'STANDARD',
    candidateId: 'sha-1',
  });
  assert.equal(receipt.version, RECEIPT_VERSION);
  assert.equal(receipt.state, 'POWERHOUSE_BOUND');
  assert.equal(receipt.runId, 'run-1');
  assert.equal(receipt.candidateId, 'sha-1');
  assert.ok(receipt.canonicalStateDigest);
  assert.ok(receipt.preflightPacketDigest);
  assert.ok(receipt.receiptDigest);
  assert.equal(verifySessionReceipt(receipt, { runId: 'run-1', candidateId: 'sha-1' }).ok, true);
});

test('context without READY preflight can never bind', () => {
  assert.throws(() => bindPowerhouseSession({ sessionId: 'chat-2', runId: 'run-2', preflightPacket: { status: 'CONTEXT_ONLY' } }), /READY preflight packet/);
});

test('receipt fails closed when run, candidate or canonical state drifts', () => {
  const receipt = bindPowerhouseSession({ sessionId: 'chat-3', runId: 'run-3', observedAt: '2026-09-17T11:31:00+02:00', preflightPacket: preflight, candidateId: 'sha-a' });
  assert.equal(verifySessionReceipt(receipt, { runId: 'run-other' }).ok, false);
  assert.equal(verifySessionReceipt(receipt, { runId: 'run-3', candidateId: 'sha-b' }).ok, false);
  assert.equal(verifySessionReceipt(receipt, { runId: 'run-3', expectedCanonicalStateDigest: 'changed' }).ok, false);
});

test('existing authority blocks repetitive approval questions', () => {
  for (const decisionClass of ['EXISTING_ARCHITECTURE','POWERHOUSE_OPERATING_RULE','LIVE_AND_BEWEZEN_DELIVERY','CANONICAL_WRITEBACK','DOCUMENTATION','SAFE_IMPLEMENTATION_DETAIL','AUTHORIZED_CONTINUATION']) {
    const result = resolveApprovalRequest({ decisionClass });
    assert.equal(result.action, 'CONTINUE_AUTONOMOUSLY');
    assert.equal(result.allowed, false);
    assert.throws(() => assertApprovalRequestAllowed({ decisionClass }), /APPROVAL_REQUEST_BLOCKED/);
  }
});

test('hard human-authority boundaries are the only approval path', () => {
  for (const decisionClass of ['SECRETS_OR_CREDENTIALS','PERMISSIONS','SECURITY_CONTROL_WEAKENING','DESTRUCTIVE_OR_IRREVERSIBLE_DATA','PAID_EXTERNAL_RESOURCE','LEGAL_OR_FINANCIAL_COMMITMENT','GENUINELY_NEW_UNRESOLVED_CHOICE']) {
    const result = resolveApprovalRequest({ decisionClass, reason: 'new human boundary' });
    assert.equal(result.action, 'ASK_USER');
    assert.equal(result.allowed, true);
    assert.equal(assertApprovalRequestAllowed({ decisionClass, reason: 'new human boundary' }).allowed, true);
  }
});

test('unknown decisions default to autonomous continuation, not another approval question', () => {
  const result = resolveApprovalRequest({ decisionClass: 'UNKNOWN_SAFE_DETAIL' });
  assert.equal(result.action, 'CONTINUE_AUTONOMOUSLY');
  assert.equal(result.allowed, false);
});
