import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { classifyTerminalState, evaluateExecutionLease, evaluateFinishingPressure, reconcileExecution } from '../tools/delivery/one-loop.mjs';
import { normalizeGitHubDeliveryTelemetry } from '../tools/delivery/github-learning.mjs';
import { classifyCandidate, evaluateAdmission } from '../tools/delivery/delivery-hygiene.mjs';

const evidence = { exactHeadVerified: true, protectedMergeVerified: true, runtimeReadbackVerified: true, learningWritebackVerified: true };
const baseSha = 'a'.repeat(40);
const policy = JSON.parse(readFileSync(new URL('../config/powerhouse-delivery-hygiene-v1.json', import.meta.url), 'utf8'));

function candidate(number, obligationId, candidateType, lane = 'automation') {
  return classifyCandidate({
    number,
    state: 'open',
    body: `Obligation-ID: ${obligationId}\nDelivery-Lane: ${lane}\nCandidate-Type: ${candidateType}\nBase-SHA: ${baseSha}\nSupersedes: none`,
    baseSha,
    headSha: String(number).padStart(40, 'b').slice(0, 40),
  }, policy);
}

test('delivery lane treats stranded states as recoverable and evidence-backed fulfillment as terminal', () => {
  for (const state of ['COMMITTED','PR_OPEN','CI_QUEUED','TIMEOUT','CHAT_STOPPED','WORKER_LOST','LEASE_EXPIRED']) {
    const result = classifyTerminalState(state, evidence);
    assert.equal(result.valid, false, state);
    assert.equal(result.recoveryRequired, true, state);
  }
  assert.equal(classifyTerminalState('FULFILLED', evidence).valid, true);
  assert.equal(evaluateExecutionLease({ state: 'EXECUTING', leaseExpiresAt: '2026-09-17T17:59:00Z' }, Date.parse('2026-09-17T18:00:00Z')), 'RECOVER');
});

test('delivery lane preserves finish-before-start and single-candidate recovery', () => {
  assert.equal(evaluateFinishingPressure({ maxExecutable: 5, admittedExecutable: 5, finishing: 2, candidate: { type: 'implementation', lane: 'portal' } }).decision, 'WAITING_CAPACITY');
  assert.equal(reconcileExecution({ state: 'WORKER_LOST', activeCandidates: ['a','b'], candidateSha: 'a' }).action, 'REVIEW_REQUIRED');
  assert.equal(policy.wip.finishBeforeStart, true);
  assert.ok(policy.deliveryControlPlanePaths.includes('config/powerhouse-one-loop-v1.json'));
});

test('canonical delivery hygiene holds new implementation while promotion or recovery is finishing', () => {
  const implementation = candidate(20, 'new-feature', 'implementation');
  const promotion = candidate(10, 'release-existing', 'promotion');
  const blocked = evaluateAdmission({ candidate: implementation, openCandidates: [promotion], policy, currentMainSha: baseSha });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.state, 'WAITING_CAPACITY');
  assert.deepEqual(blocked.blockers, [10]);

  const recovery = candidate(30, 'incident-fix', 'recovery', 'incident');
  const priority = evaluateAdmission({ candidate: recovery, openCandidates: [promotion], policy, currentMainSha: baseSha });
  assert.equal(priority.ok, true);
});

test('GitHub failures generate stable reusable delivery fingerprints', () => {
  const make = (obligationId, number, headSha) => normalizeGitHubDeliveryTelemetry({
    obligationId,
    pr: { number, createdAt: '2026-09-17T18:00:00Z', headSha, baseSha: 'base', mergeable: false },
    workflows: [{ name: 'Required test', queuedAt: '2026-09-17T18:00:00Z', startedAt: '2026-09-17T18:01:00Z', completedAt: '2026-09-17T18:02:00Z', conclusion: 'failure', attempt: 1 }],
    mainMovements: 1,
    mergeConflicts: 1,
  });
  assert.equal(make('a',1,'a').failureFingerprint, make('b',2,'b').failureFingerprint);
});
