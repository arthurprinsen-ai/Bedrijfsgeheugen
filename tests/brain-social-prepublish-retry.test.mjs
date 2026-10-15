import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isTransientPrePublishReviewFailure } from '../supabase/functions/_shared/social-prepublish-retry.mjs';

test('transient reviewer failures remain retryable, including rate limits and gateway outages', () => {
  for (const http of [429, 500, 502, 503, 504, '503']) {
    assert.equal(isTransientPrePublishReviewFailure(http), true, String(http));
  }
});

test('reviewer denials and successful responses are not classified as outages', () => {
  for (const http of [200, 201, 400, 401, 403, 404, 409, 422, 0, null]) {
    assert.equal(isTransientPrePublishReviewFailure(http), false, String(http));
  }
});

test('publisher does not convert transient review failure to permanent blocked and still fails closed', () => {
  const source = readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('if (isTransientPrePublishReviewFailure(gate.http))');
  assert.notEqual(start, -1);
  const stop = source.indexOf('if (gate.http !== 200', start);
  assert.ok(stop > start);
  const retryBranch = source.slice(start, stop);
  assert.match(retryBranch, /state:\s*'content_ready'/);
  assert.match(retryBranch, /provider_truth_verified:\s*false/);
  assert.match(retryBranch, /provider_create_success:\s*false/);
  assert.match(retryBranch, /status:\s*'review_retry_pending'/);
  assert.doesNotMatch(retryBranch, /publishLinkedIn|publishInstagram|provider_create_success:\s*true/);
  assert.match(source.slice(stop, stop + 450), /gate\.can_publish !== true/);
});
