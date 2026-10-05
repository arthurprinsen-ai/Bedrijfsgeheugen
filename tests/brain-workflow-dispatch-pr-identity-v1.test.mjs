import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGitHubDeliveryEvent } from '../tools/delivery-github-event-context.mjs';

const sha = char => char.repeat(40);

test('recovery dispatch binds explicit PR identity and immutable PR refs', () => {
  assert.deepEqual(normalizeGitHubDeliveryEvent({
    eventName: 'workflow_dispatch',
    event: { pull_request: { number: 3741, base: { sha: sha('a') }, head: { sha: sha('b') } } },
    githubSha: sha('b'),
    runId: '37331578243',
    fallbackBaseSha: sha('c'),
  }), {
    mode: 'workflow_dispatch',
    changeId: 'dispatch-pr-3741',
    baseSha: sha('a'),
    changeHeadSha: sha('b'),
    candidateSha: sha('b'),
    headSha: sha('b'),
    prNumber: '3741',
  });
});

test('recovery dispatch never uses GitHub run id as pull request number', () => {
  const result = normalizeGitHubDeliveryEvent({
    eventName: 'workflow_dispatch',
    event: {},
    githubSha: sha('d'),
    runId: '37331578243',
    fallbackBaseSha: sha('e'),
  });
  assert.equal(result.prNumber, null);
  assert.equal(result.changeId, 'dispatch-37331578243');
});
