import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiUsageStore, createCanonicalAiUsageWriter } from '../netlify/functions/_ai-usage-store.mjs';

function memoryBlobStore() {
  const values = new Map();
  return {
    async setJSON(key, value) { values.set(key, structuredClone(value)); },
    async get(key) { return values.has(key) ? structuredClone(values.get(key)) : null; },
    async list({ prefix = '' } = {}) { return { blobs: [...values.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) }; },
    values,
  };
}

const event = { schemaVersion:1, requestId:'CTX-1', componentKey:'agent:portal-qa', provider:'Anthropic', providerModelId:'M1', inputTokens:5, outputTokens:3, cacheReadTokens:0, cacheWriteTokens:0, totalTokens:8, at:'2026-09-15T18:00:00.000Z' };
const context = { tenantId:'tenant-1', activityType:'portal_qa', actionId:'11111111-1111-1111-1111-111111111111', opportunityKey:'opp-1', campaignKey:'camp-1', outcomeKey:'out-1' };

test('forwards explicit business attribution only to the canonical usage writer', async () => {
  const blob = memoryBlobStore();
  const calls = [];
  const usage = createAiUsageStore(blob, { canonicalWriter: async (record, contextValue) => { calls.push({ record, context:contextValue }); return { inserted:true }; } });
  const result = await usage.record(event, context);
  assert.equal(result.recorded, true);
  assert.equal(result.canonicalRecorded, true);
  assert.deepEqual(calls, [{ record:event, context }]);
  assert.deepEqual([...blob.values.values()], [event]);
});

test('canonical HTTP writer maps only allowlisted attribution fields to metadata', async () => {
  const requests = [];
  const writer = createCanonicalAiUsageWriter({
    baseUrl:'https://example.supabase.co',
    serviceToken:'TEST_SERVICE_TOKEN',
    fetchFn: async (url, init) => {
      requests.push({ url, init });
      return { ok:true, async json(){ return { inserted:true }; } };
    },
  });
  await writer(event, { ...context, prompt:'do-not-forward', arbitrary:'omit-me', empty:'' });
  const body = JSON.parse(requests[0].init.body);
  assert.deepEqual(body.usage.metadata, {
    input_tokens:5,
    output_tokens:3,
    cache_read_tokens:0,
    cache_write_tokens:0,
    tenant_id:'tenant-1',
    activity_type:'portal_qa',
    action_id:'11111111-1111-1111-1111-111111111111',
    opportunity_key:'opp-1',
    campaign_key:'camp-1',
    outcome_key:'out-1',
  });
  assert.equal(JSON.stringify(body).includes('do-not-forward'), false);
  assert.equal(JSON.stringify(body).includes('omit-me'), false);
});

test('omitted business attribution keeps the existing canonical writer contract and blob event unchanged', async () => {
  const blob = memoryBlobStore();
  const calls = [];
  const usage = createAiUsageStore(blob, { canonicalWriter: async (...args) => { calls.push(args); return { inserted:true }; } });
  const websiteEvent = { ...event, requestId:'CTX-2', componentKey:'agent:website-qa', inputTokens:2, outputTokens:1, totalTokens:3, at:'2026-09-15T18:05:00.000Z' };
  await usage.record(websiteEvent);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [websiteEvent, undefined]);
  assert.deepEqual([...blob.values.values()], [websiteEvent]);
});
