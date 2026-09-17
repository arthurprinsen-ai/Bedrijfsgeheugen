import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyTerminalState,
  evaluateExecutionLease,
  evaluateFinishingPressure,
  reconcileExecution,
} from '../tools/delivery/one-loop.mjs';

const evidence = {
  exactHeadVerified: true,
  protectedMergeVerified: true,
  runtimeReadbackVerified: true,
  learningWritebackVerified: true,
};

test('committed and delivery-progress states can never be valid terminal completion', () => {
  for (const state of ['COMMITTED', 'PR_OPEN', 'CI_QUEUED', 'TIMEOUT', 'CHAT_STOPPED', 'WORKER_LOST', 'LEASE_EXPIRED']) {
    const result = classifyTerminalState(state, evidence);
    assert.equal(result.terminal, false, state);
    assert.equal(result.valid, false, state);
    assert.equal(result.recoveryRequired, true, state);
  }
});

test('LIVE_PROVEN and FULFILLED require exact runtime and learning evidence', () => {
  assert.deepEqual(classifyTerminalState('LIVE_PROVEN', evidence), {
    terminal: true,
    valid: true,
    recoveryRequired: false,
    reason: 'TERMINAL_EVIDENCE_PROVEN',
  });
  assert.equal(classifyTerminalState('FULFILLED', { ...evidence, learningWritebackVerified: false }).valid, false);
});

test('BLOCKED_EXTERNAL is terminal only with external proof and a concrete recovery path', () => {
  assert.equal(classifyTerminalState('BLOCKED_EXTERNAL', {
    externalBlockerVerified: true,
    recoveryPath: 'Provider must restore API availability; rerun canonical obligation after provider readback.',
  }).valid, true);
  assert.equal(classifyTerminalState('BLOCKED_EXTERNAL', { externalBlockerVerified: true }).valid, false);
});

test('stale non-terminal lease recovers while proven terminal execution does not', () => {
  const now = Date.parse('2026-09-17T18:00:00Z');
  assert.equal(evaluateExecutionLease({ state: 'EXECUTING', leaseExpiresAt: '2026-09-17T17:59:00Z' }, now), 'RECOVER');
  assert.equal(evaluateExecutionLease({ state: 'FULFILLED', leaseExpiresAt: '2026-09-17T17:00:00Z', evidence }, now), 'TERMINAL');
  assert.equal(evaluateExecutionLease({ state: 'EXECUTING', leaseExpiresAt: '2026-09-17T18:05:00Z' }, now), 'HEALTHY');
});

test('finishing pressure holds lower-priority starts when executable capacity is saturated', () => {
  const result = evaluateFinishingPressure({
    maxExecutable: 5,
    admittedExecutable: 5,
    finishing: 3,
    candidate: { type: 'implementation', lane: 'portal' },
  });
  assert.equal(result.decision, 'WAITING_CAPACITY');
  assert.equal(result.reason, 'FINISH_EXISTING_WORK_FIRST');

  const incident = evaluateFinishingPressure({
    maxExecutable: 5,
    admittedExecutable: 5,
    finishing: 3,
    candidate: { type: 'recovery', lane: 'incident' },
  });
  assert.equal(incident.decision, 'ADMIT_PRIORITY_RECOVERY');
});

test('reconciliation never creates a duplicate active candidate and is idempotent after side effects', () => {
  assert.equal(reconcileExecution({
    state: 'WORKER_LOST',
    activeCandidates: ['sha-a'],
    candidateSha: 'sha-a',
    sideEffectAlreadyApplied: false,
    terminalEvidence: false,
  }).action, 'RECOVER');

  assert.equal(reconcileExecution({
    state: 'WORKER_LOST',
    activeCandidates: ['sha-a', 'sha-b'],
    candidateSha: 'sha-a',
    sideEffectAlreadyApplied: false,
    terminalEvidence: false,
  }).action, 'REVIEW_REQUIRED');

  assert.equal(reconcileExecution({
    state: 'RETRYABLE_FAILURE',
    activeCandidates: ['sha-a'],
    candidateSha: 'sha-a',
    sideEffectAlreadyApplied: true,
    terminalEvidence: false,
  }).action, 'CONTINUE');
});
