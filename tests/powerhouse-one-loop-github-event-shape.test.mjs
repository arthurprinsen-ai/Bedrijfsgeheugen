import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGitHubDeliveryTelemetry } from '../tools/delivery/github-learning.mjs';

test('GitHub evidence excludes volatile PR identity from failure fingerprint', () => {
  const shape = (number, headSha) => normalizeGitHubDeliveryTelemetry({
    obligationId: `obligation-${number}`,
    pr: {
      number,
      createdAt: '2026-09-17T18:00:00Z',
      headSha,
      baseSha: 'base',
      mergeable: false,
    },
    workflows: [{
      name: 'Required test',
      queuedAt: '2026-09-17T18:00:00Z',
      startedAt: '2026-09-17T18:01:00Z',
      completedAt: '2026-09-17T18:02:00Z',
      conclusion: 'failure',
      attempt: 1,
    }],
    mainMovements: 1,
    mergeConflicts: 1,
  });

  assert.equal(shape(1, 'a').failureFingerprint, shape(2, 'b').failureFingerprint);
});
