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

test('forwards explicit business attribution only to the canonical usage writer', async () => {
  const blob = memoryBlobStore();
  const calls = [];
  const usage = createAiUsageStore(blob, { canonicalWriter: async (record, context) => { calls.push({ record, context }); return { inserted:true }; } });
  const event = { schemaVersion:1, requestId:'CTX-1', componentKey:'agent:portal-qa', provider:'Anthropic', providerModelId:'M1', inputTokens:5, outputTokens:3, cacheReadTokens:0, cacheWriteTokens:0, totalTokens:8, at:'2026-09-15T18:00:00.000Z' };
  const context = { tenantId:'tenant-1', activityType:'portal_qa', actionId:'11111111-1111-1111-1111-111111111111', opportunityKey:'opp-1', campaignKey:'camp-1', outcomeKey:'out-1' };

  const result = await usage.record(event, context);

  assert.equal(result.recorded, true);
  assert.equal(result.canonicalRecorded, true);
  assert.deepEqual(calls, [{ record:event, context }]);
  assert.deepEqual([...blob.values.values()], [event]);
});

test('omitted business attribution keeps the existing canonical writer contract and blob event unchanged', async () => {
  const blob = memoryBlobStore();
  const calls = [];
  const usage = createAiUsageStore(blob, { canonicalWriter: async (...args) => { calls.push(args); return { inserted:true }; } });
  const event = { schemaVersion:1, requestId:'CTX-2', componentKey:'agent:website-qa', provider:'Anthropic', providerModelId:'M1', inputTokens:2, outputTokens:1, cacheReadTokens:0, cacheWriteTokens:0, totalTokens:3, at:'2026-09-15T18:05:00.000Z' };

  await usage.record(event);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [event, undefined]);
  assert.deepEqual([...blob.values.values()], [event]);
});
