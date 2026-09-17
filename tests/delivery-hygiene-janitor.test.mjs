import test from 'node:test';
import assert from 'node:assert/strict';
import { planRepositoryCleanup } from '../tools/delivery/repository-janitor.mjs';

const SHA = 'a'.repeat(40);
const policy = {
  wip: { maxExecutable: 5 },
  nonProductLanes: ['dependency', 'docs'],
  allowedLanes: ['backend', 'portal', 'website', 'automation', 'security', 'incident', 'dependency', 'docs'],
  allowedCandidateTypes: ['implementation', 'recovery', 'security', 'dependency', 'docs', 'promotion'],
};

function pr(number, obligationId, { supersedes = null, title = '', lane = 'backend', type = 'implementation', uniqueCommits = true, body } = {}) {
  const metadataBody = body ?? `Obligation-ID: ${obligationId}\nDelivery-Lane: ${lane}\nCandidate-Type: ${type}\nBase-SHA: ${SHA}\nSupersedes: ${supersedes ?? 'none'}`;
  return { number, state: 'open', title, body: metadataBody, baseSha: SHA, headSha: String(number).padStart(40, '0'), uniqueCommits };
}

test('dry-run plans explicit same-obligation supersession without mutating', () => {
  const predecessor = pr(1, 'BG-1');
  const successor = pr(2, 'BG-1', { supersedes: 1 });
  const plan = planRepositoryCleanup({ candidates: [predecessor, successor], policy, mode: 'dry-run' });
  assert.deepEqual(plan.actions.map(action => [action.type, action.prNumber, action.perform]), [['CLOSE_PR', 1, false]]);
  assert.equal(plan.actions[0].reason, 'EXPLICIT_SAME_OBLIGATION_SUCCESSOR');
});

test('apply-safe marks only deterministic actions performable', () => {
  const plan = planRepositoryCleanup({ candidates: [pr(1, 'BG-1'), pr(2, 'BG-1', { supersedes: 1 })], policy, mode: 'apply-safe' });
  assert.equal(plan.actions[0].perform, true);
});

test('similar titles and paths never create automatic cleanup lineage', () => {
  const plan = planRepositoryCleanup({
    candidates: [pr(1, 'BG-1', { title: 'Fix portal' }), pr(2, 'BG-2', { title: 'Fix portal' })],
    policy,
    mode: 'apply-safe',
  });
  assert.equal(plan.actions.length, 0);
});

test('legacy unclassified candidates remain review-required and do not consume new WIP budget', () => {
  const legacy = { number: 8, state: 'open', title: 'Old PR', body: '', baseSha: SHA, headSha: 'b'.repeat(40), uniqueCommits: true };
  const plan = planRepositoryCleanup({ candidates: [legacy, pr(1, 'BG-1')], policy, mode: 'dry-run' });
  assert.deepEqual(plan.legacyUnclassified, [8]);
  assert.equal(plan.wipCount, 1);
  assert.equal(plan.reviewRequired.some(row => row.prNumber === 8), true);
});

test('legacy candidate whose head is fully contained in main is deterministically safe to close', () => {
  const legacy = { number: 8, state: 'open', title: 'Old PR', body: '', baseSha: SHA, headSha: 'b'.repeat(40), uniqueCommits: false };
  const plan = planRepositoryCleanup({ candidates: [legacy], policy, mode: 'apply-safe' });
  assert.equal(plan.actions.length, 1);
  assert.equal(plan.actions[0].type, 'CLOSE_PR');
  assert.equal(plan.actions[0].reason, 'ALREADY_CONTAINED_IN_MAIN');
  assert.equal(plan.actions[0].perform, true);
});

test('fulfilled obligation with unique commits is never auto-closed', () => {
  const plan = planRepositoryCleanup({ candidates: [pr(1, 'BG-1', { uniqueCommits: true })], policy, mode: 'apply-safe', fulfilledObligationIds: ['BG-1'] });
  assert.equal(plan.actions.length, 0);
  assert.equal(plan.reviewRequired[0].reason, 'FULFILLED_WITH_UNIQUE_COMMITS');
});

test('fulfilled obligation with proven no unique commits is safe to close', () => {
  const plan = planRepositoryCleanup({ candidates: [pr(1, 'BG-1', { uniqueCommits: false })], policy, mode: 'apply-safe', fulfilledObligationIds: ['BG-1'] });
  assert.equal(plan.actions[0].type, 'CLOSE_PR');
  assert.equal(plan.actions[0].reason, 'ALREADY_CONTAINED_IN_MAIN');
  assert.equal(plan.actions[0].perform, true);
});
