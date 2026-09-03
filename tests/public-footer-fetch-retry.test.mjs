import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithBoundedRetry } from '../tools/public-fetch-retry.mjs';

test('public smoke retries a transient network failure at most twice then succeeds', async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts < 3) {
      const error = new Error('read ECONNRESET');
      error.code = 'ECONNRESET';
      throw error;
    }
    return { ok: true, status: 200 };
  };
  const response = await fetchWithBoundedRetry('https://example.test', { fetchImpl, sleepImpl: async () => {} });
  assert.equal(response.status, 200);
  assert.equal(attempts, 3);
});

test('public smoke does not retry a real 404', async () => {
  let attempts = 0;
  const response = await fetchWithBoundedRetry('https://example.test/missing', {
    fetchImpl: async () => { attempts += 1; return { ok: false, status: 404 }; },
    sleepImpl: async () => {}
  });
  assert.equal(response.status, 404);
  assert.equal(attempts, 1);
});
