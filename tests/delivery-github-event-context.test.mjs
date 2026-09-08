import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGitHubDeliveryEvent } from '../tools/delivery-github-event-context.mjs';

const sha = char => char.repeat(40);

test('pull request event normalizes immutable delivery identity', () => {
  assert.deepEqual(normalizeGitHubDeliveryEvent({
    eventName: 'pull_request',
    event: { pull_request: { number: 1195, base: { sha: sha('a') }, head: { sha: sha('b') } } },
    githubSha: sha('c'),
    runId: '123',
  }), {
    mode: 'pull_request',
    changeId: 'pr-1195',
    baseSha: sha('a'),
    headSha: sha('b'),
    prNumber: '1195',
  });
});

test('merge group event normalizes without pull_request fields', () => {
  assert.deepEqual(normalizeGitHubDeliveryEvent({
    eventName: 'merge_group',
    event: { merge_group: { base_sha: sha('d'), head_sha: sha('e'), head_ref: 'refs/heads/gh-readonly-queue/main/pr-1195-bbbbbbbb' } },
    githubSha: sha('e'),
    runId: '456',
  }), {
    mode: 'merge_group',
    changeId: 'merge-group-' + sha('e').slice(0, 12),
    baseSha: sha('d'),
    headSha: sha('e'),
    prNumber: '456',
  });
});

test('workflow dispatch falls back to checked out SHA and its parent base', () => {
  assert.deepEqual(normalizeGitHubDeliveryEvent({
    eventName: 'workflow_dispatch',
    event: {},
    githubSha: sha('f'),
    runId: '789',
    fallbackBaseSha: sha('1'),
  }), {
    mode: 'workflow_dispatch',
    changeId: 'dispatch-789',
    baseSha: sha('1'),
    headSha: sha('f'),
    prNumber: '789',
  });
});

test('invalid delivery event SHAs fail closed', () => {
  assert.throws(() => normalizeGitHubDeliveryEvent({
    eventName: 'merge_group',
    event: { merge_group: { base_sha: 'bad', head_sha: sha('a') } },
    githubSha: sha('a'),
    runId: '1',
  }), /valid baseSha/i);
});
