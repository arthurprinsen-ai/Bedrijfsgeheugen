import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGitHubDeliveryTelemetry } from '../tools/delivery/github-learning.mjs';

test('normalizes GitHub delivery events into deterministic learning evidence', () => {
  const input = {
    obligationId: 'powerhouse-one-loop-v1',
    pr: {
      number: 1968,
      createdAt: '2026-09-17T18:11:29Z',
      mergedAt: '2026-09-17T18:21:29Z',
      headSha: 'abc',
      baseSha: 'def',
      mergeable: true,
      supersedes: null,
    },
    workflows: [
      { name: 'Required test', queuedAt: '2026-09-17T18:12:00Z', startedAt: '2026-09-17T18:14:00Z', completedAt: '2026-09-17T18:18:00Z', conclusion: 'success', attempt: 1 },
      { name: 'Backend', queuedAt: '2026-09-17T18:12:00Z', startedAt: '2026-09-17T18:13:00Z', completedAt: '2026-09-17T18:17:00Z', conclusion: 'failure', attempt: 1 },
      { name: 'Backend', queuedAt: '2026-09-17T18:17:10Z', startedAt: '2026-09-17T18:17:20Z', completedAt: '2026-09-17T18:19:00Z', conclusion: 'success', attempt: 2 },
    ],
    liveProvenAt: '2026-09-17T18:24:29Z',
    fulfilledAt: '2026-09-17T18:25:29Z',
    mainMovements: 2,
    mergeConflicts: 1,
  };

  const actual = normalizeGitHubDeliveryTelemetry(input);
  assert.equal(actual.obligationId, 'powerhouse-one-loop-v1');
  assert.equal(actual.queueMs, 190000);
  assert.equal(actual.workflowRuntimeMs, 580000);
  assert.equal(actual.reruns, 1);
  assert.equal(actual.failedAttempts, 1);
  assert.equal(actual.mainMovements, 2);
  assert.equal(actual.mergeConflicts, 1);
  assert.equal(actual.obligationToLiveMs, 780000);
  assert.equal(actual.obligationToFulfilledMs, 840000);
  assert.match(actual.failureFingerprint, /^github-delivery:/);
});

test('same delivery failure pattern yields the same reusable fingerprint', () => {
  const base = {
    obligationId: 'a',
    pr: { number: 1, createdAt: '2026-09-17T18:00:00Z', headSha: 'sha-1', baseSha: 'base', mergeable: false },
    workflows: [{ name: 'Required test', queuedAt: '2026-09-17T18:00:00Z', startedAt: '2026-09-17T18:05:00Z', completedAt: '2026-09-17T18:06:00Z', conclusion: 'failure', attempt: 1 }],
    mainMovements: 1,
    mergeConflicts: 1,
  };
  const first = normalizeGitHubDeliveryTelemetry(base).failureFingerprint;
  const second = normalizeGitHubDeliveryTelemetry({ ...base, obligationId: 'b', pr: { ...base.pr, number: 2, headSha: 'sha-2' } }).failureFingerprint;
  assert.equal(first, second);
});
