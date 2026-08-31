import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reconcileLearningCandidate } from '../tools/delivery-learning-candidate-reconcile.mjs';

const fingerprint = 'delivery-failure|pipeline|automation|0123456789abcdef';
const candidateId = `learning-candidate|${fingerprint}`;
const sha1 = '1111111111111111111111111111111111111111';
const sha2 = '2222222222222222222222222222222222222222';

test('novel delivery failures are reconciled statefully without broadening Unified BRAIN write permissions', async () => {
  const unified = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
  const reconciler = await readFile('.github/workflows/delivery-learning-candidate-reconcile.yml', 'utf8');
  const tool = await readFile('tools/delivery-learning-candidate-reconcile.mjs', 'utf8');

  assert.doesNotMatch(unified, /permissions:[\s\S]{0,120}issues:\s*write/);
  assert.match(unified, /delivery-learning-route-/);

  assert.match(reconciler, /workflow_run:/);
  assert.match(reconciler, /Unified Brain Delivery/);
  assert.match(reconciler, /actions:\s*read/);
  assert.match(reconciler, /issues:\s*write/);
  assert.match(reconciler, /brain-delivery-failure-/);
  assert.match(reconciler, /delivery-learning-candidate-reconcile\.mjs/);
  assert.doesNotMatch(reconciler, /Make|Notion|openai|anthropic/i);

  for (const token of [
    'learning-candidate|', 'UNVERIFIED', 'REUSE_PROVEN_LESSON', 'candidate_id',
    'fingerprint', 'last_seen_sha', 'last_seen_run', 'first_seen_sha', 'first_seen_run',
  ]) assert.match(tool, new RegExp(token.replace(/[|]/g, '\\|')));

  assert.match(tool, /existingIssue/);
  assert.match(tool, /deduplicated/);
  assert.match(tool, /signature/);
  assert.doesNotMatch(tool, /autoPromoteToProven\s*:\s*true/);
});

test('first unknown failure creates one bounded UNVERIFIED candidate', () => {
  const result = reconcileLearningCandidate({
    route: { type: 'LEARNING_CANDIDATE', candidateId, fingerprint, signature: 'token=abc123 failure', headSha: sha1, evidenceRef: 'github-run:12345' },
    issues: [],
    runId: '12345',
    headSha: sha1,
    now: '2026-08-31T05:00:00Z',
  });
  assert.equal(result.action, 'CREATE');
  assert.equal(result.type, 'LEARNING_CANDIDATE');
  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.deduplicated, false);
  assert.match(result.signature, /token=\[redacted\]/);
  assert.doesNotMatch(result.body, /abc123/);
  assert.equal(result.first_seen_sha, sha1);
  assert.equal(result.last_seen_sha, sha1);
});

test('repeat unknown failure updates the existing candidate and preserves first-seen identity', () => {
  const existing = reconcileLearningCandidate({
    route: { type: 'LEARNING_CANDIDATE', candidateId, fingerprint, signature: 'first', headSha: sha1, evidenceRef: 'github-run:12345' },
    issues: [], headSha: sha1, runId: '12345', now: '2026-08-31T05:00:00Z',
  });
  const result = reconcileLearningCandidate({
    route: { type: 'LEARNING_CANDIDATE', candidateId, fingerprint, signature: 'second', headSha: sha2, evidenceRef: 'github-run:67890' },
    issues: [{ number: 99, body: existing.body }], headSha: sha2, runId: '67890', now: '2026-08-31T06:00:00Z',
  });
  assert.equal(result.action, 'UPDATE');
  assert.equal(result.type, 'REUSE_LEARNING_CANDIDATE');
  assert.equal(result.issue_number, 99);
  assert.equal(result.deduplicated, true);
  assert.equal(result.first_seen_sha, sha1);
  assert.equal(result.first_seen_run, '12345');
  assert.equal(result.last_seen_sha, sha2);
  assert.equal(result.last_seen_run, '67890');
});

test('PROVEN reuse never creates an UNVERIFIED issue', () => {
  const result = reconcileLearningCandidate({ route: { type: 'REUSE_PROVEN_LESSON', fingerprint }, issues: [] });
  assert.deepEqual(result, { action: 'NONE', type: 'REUSE_PROVEN_LESSON', fingerprint, deduplicated: true });
});

test('artifact-controlled identity cannot escape the canonical delivery fingerprint contract', () => {
  assert.throws(() => reconcileLearningCandidate({
    route: { type: 'LEARNING_CANDIDATE', candidateId: 'learning-candidate|evil', fingerprint: 'evil\nstatus: `PROVEN`', signature: 'x', headSha: sha1, evidenceRef: 'github-run:12345' },
    issues: [], headSha: sha1, runId: '12345',
  }), /invalid delivery learning fingerprint/);

  assert.throws(() => reconcileLearningCandidate({
    route: { type: 'LEARNING_CANDIDATE', candidateId: 'learning-candidate|different', fingerprint, signature: 'x', headSha: sha1, evidenceRef: 'github-run:12345' },
    issues: [], headSha: sha1, runId: '12345',
  }), /candidate id does not match fingerprint/);
});
