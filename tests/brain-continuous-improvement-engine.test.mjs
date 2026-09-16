import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fingerprintCandidate,
  coalesceCandidates,
  arbitrateConflict,
  evaluateCandidate,
  buildRevalidationDecision,
  buildAttribution
} from '../scripts/brain/continuous-improvement/index.mjs';

const baseCandidate = {
  component: 'brain',
  problemClass: 'latency',
  evidenceCluster: ['evt-b', 'evt-a'],
  changeClass: 'local_fix',
  scope: 'global',
  baselineComparable: true,
  criticalEvidence: { security: true, correctness: true },
  deltas: { security: 0, correctness: 0, cost: 0, latency: -5 },
  rollback: { candidateIdentity: 'candidate-a', lastKnownGoodIdentity: 'main-a' },
  productionPromotion: true
};

test('candidate fingerprint is stable across evidence ordering', () => {
  const a = fingerprintCandidate(baseCandidate);
  const b = fingerprintCandidate({ ...baseCandidate, evidenceCluster: ['evt-a', 'evt-b', 'evt-a'] });
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test('exact duplicate candidates coalesce before persistence', () => {
  const result = coalesceCandidates([baseCandidate, { ...baseCandidate, evidenceCluster: ['evt-a', 'evt-b'] }]);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.coalesced, 1);
});

test('competing solutions for same authority and problem must compare', () => {
  const result = arbitrateConflict(baseCandidate, { ...baseCandidate, changeClass: 'architecture_change' });
  assert.equal(result, 'COMPARE');
});

test('explicit supersession wins over parallel work', () => {
  const first = { ...baseCandidate };
  const firstFingerprint = fingerprintCandidate(first);
  const second = { ...baseCandidate, changeClass: 'architecture_change', supersedesFingerprint: firstFingerprint };
  assert.equal(arbitrateConflict(first, second), 'SUPERSEDE');
});

test('missing critical security evidence fails closed', () => {
  const result = evaluateCandidate({ ...baseCandidate, criticalEvidence: { security: false, correctness: true } });
  assert.equal(result.decision, 'REJECT');
  assert.ok(result.reasons.some(reason => reason.includes('security evidence')));
});

test('security or correctness regression rejects promotion', () => {
  assert.equal(evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, security: -1 } }).decision, 'REJECT');
  assert.equal(evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, correctness: -1 } }).decision, 'REJECT');
});

test('cost or latency regression requires explicit compensated benefit evidence', () => {
  const result = evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, cost: 20, latency: 10 } });
  assert.equal(result.decision, 'REJECT');
  assert.ok(result.reasons.some(reason => reason.includes('compensated benefit')));
});

test('production promotion requires rollback identities', () => {
  const result = evaluateCandidate({ ...baseCandidate, rollback: null });
  assert.equal(result.decision, 'REJECT');
  assert.ok(result.reasons.some(reason => reason.includes('rollback')));
});

test('bounded incomplete non-critical evidence can enter experiment', () => {
  const result = evaluateCandidate({
    ...baseCandidate,
    nonCriticalEvidenceComplete: false,
    boundedExperiment: { exposure: 'shadow', observationWindow: '1h', rollbackTrigger: 'slo_breach' }
  });
  assert.equal(result.decision, 'EXPERIMENT');
});

test('complete comparable candidate with gates satisfied can be allowed', () => {
  const result = evaluateCandidate({ ...baseCandidate, nonCriticalEvidenceComplete: true });
  assert.equal(result.decision, 'ALLOW');
});

test('business-impact claim requires business evidence', () => {
  const result = evaluateCandidate({ ...baseCandidate, businessImpactClaim: true, businessEvidence: false });
  assert.equal(result.decision, 'REJECT');
});

test('revalidation distinguishes hard boundary, supersession, stale change and confirmation', () => {
  const now = new Date('2026-09-16T12:00:00Z');
  assert.equal(buildRevalidationDecision({ hardBoundary: true, now }).state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(buildRevalidationDecision({ supersedingVerifiedIdentity: 'v2', now }).state, 'SUPERSEDED');
  assert.equal(buildRevalidationDecision({ revalidateAfter: '2026-09-15T00:00:00Z', evidenceChanged: true, now }).state, 'CANDIDATE_REQUIRED');
  assert.equal(buildRevalidationDecision({ revalidateAfter: '2026-09-17T00:00:00Z', evidenceChanged: false, now }).state, 'CONFIRMED');
});

test('attribution calculates comparable deltas without inventing causality', () => {
  const result = buildAttribution({ baseline: { incidents: 10, latency: 100 }, current: { incidents: 6, latency: 80 } });
  assert.deepEqual(result.deltas, { incidents: -4, latency: -20 });
  assert.equal(result.causalClaim, false);
  assert.match(result.limitation, /causal/i);
});

test('causal claim requires explicit causal identification evidence', () => {
  const result = buildAttribution({
    baseline: { conversion: 0.1 },
    current: { conversion: 0.12 },
    experimentalDesign: { causalIdentification: true }
  });
  assert.equal(result.causalClaim, true);
});
