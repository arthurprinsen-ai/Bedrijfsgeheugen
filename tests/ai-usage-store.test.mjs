import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiUsageStore } from '../netlify/functions/_ai-usage-store.mjs';

function memoryBlobStore() {
  const values = new Map();
  return {
    async setJSON(key, value) { values.set(key, structuredClone(value)); },
    async get(key) { return values.has(key) ? structuredClone(values.get(key)) : null; },
    async list({ prefix = '' } = {}) { return { blobs: [...values.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) }; },
    values,
  };
}

test('stores one sanitized event per request and duplicate request ids stay idempotent', async () => {
  const blob = memoryBlobStore();
  const usage = createAiUsageStore(blob, { now: () => '2026-08-30T12:00:00+02:00' });
  const event = {
    schemaVersion: 1, requestId: 'REQ-1', componentKey: 'agent:website-qa', provider: 'Anthropic', providerModelId: 'M1',
    inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 120, at: '2026-08-30T10:00:00.000Z',
  };

  await usage.record(event);
  await usage.record(event);
  const summary = await usage.monthly({ monthlyLimitTokens: 10_000 });

  assert.equal(blob.values.size, 1);
  assert.equal(summary.usedTokens, 120);
  assert.equal(summary.tokensToday, 120);
  assert.equal(JSON.stringify([...blob.values.values()]).includes('prompt'), false);
});

test('month query excludes events outside the Amsterdam calendar month', async () => {
  const blob = memoryBlobStore();
  const usage = createAiUsageStore(blob, { now: () => '2026-09-01T00:30:00+02:00' });
  await usage.record({ schemaVersion:1, requestId:'A', componentKey:'agent:a', provider:'Anthropic', providerModelId:'M1', inputTokens:1, outputTokens:1, cacheReadTokens:0, cacheWriteTokens:0, totalTokens:2, at:'2026-08-31T21:59:00.000Z' });
  await usage.record({ schemaVersion:1, requestId:'B', componentKey:'agent:a', provider:'Anthropic', providerModelId:'M1', inputTokens:2, outputTokens:2, cacheReadTokens:0, cacheWriteTokens:0, totalTokens:4, at:'2026-08-31T22:01:00.000Z' });

  const summary = await usage.monthly({ monthlyLimitTokens: 10_000 });
  assert.equal(summary.usedTokens, 4);
});
