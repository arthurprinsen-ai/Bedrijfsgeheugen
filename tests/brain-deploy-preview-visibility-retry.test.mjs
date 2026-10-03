import assert from 'node:assert/strict';
import test from 'node:test';
import { visibilityRetryPolicy } from '../tools/site-shell/visibility-retry-policy.mjs';

test('historical replay: deploy preview gets bounded extended retry budget', () => {
  const policy = visibilityRetryPolicy('https://deploy-preview-3629--bedrijfsgeheugen.netlify.app');
  assert.equal(policy.maxAttempts, 5);
  assert.deepEqual(
    [1, 2, 3, 4].map(attempt => policy.retryDelayMs(attempt)),
    [1000, 2000, 3000, 4000]
  );
});

test('production remains strict with three attempts', () => {
  const policy = visibilityRetryPolicy('https://www.bedrijfsgeheugen.nl');
  assert.equal(policy.maxAttempts, 3);
  assert.deepEqual(
    [1, 2].map(attempt => policy.retryDelayMs(attempt)),
    [750, 1500]
  );
});

test('retry policy rejects invalid attempt numbers', () => {
  assert.throws(
    () => visibilityRetryPolicy('https://deploy-preview-1--bedrijfsgeheugen.netlify.app').retryDelayMs(0),
    /positive integer/
  );
});
