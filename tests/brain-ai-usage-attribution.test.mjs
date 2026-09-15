import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiUsageStore, createCanonicalAiUsageWriter } from '../netlify/functions/_ai-usage-store.mjs';
import { runWebsiteAnswer } from '../netlify/functions/_brain-ai.mjs';

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
    serviceToken:'token',
    fetchFn: async (url, init) => {
      requests.push({ url, init });
      return { ok:true, async json(){ return { inserted:true }; } };
    },
  });

  await writer(event, { ...context, prompt:'secret', arbitrary:'nope', empty:'' });

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
  assert.equal(JSON.stringify(body).includes('secret'), false);
  assert.equal(JSON.stringify(body).includes('arbitrary'), false);
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

test('website AI forwards verified business attribution while pinning public tenant and activity type', async () => {
  const calls = [];
  const usageStore = {
    async record(record, contextValue) {
      calls.push({ record, context: contextValue });
      return { canonicalRecorded:true };
    },
  };
  const fetchImpl = async () => ({
    ok:true,
    async json() {
      return {
        content:[{ type:'text', text:'Antwoord uit bron' }],
        usage:{ input_tokens:4, output_tokens:2 },
      };
    },
  });

  const result = await runWebsiteAnswer({
    question:'Wat levert dit op?',
    fragments:'Bronfragment',
    apiKey:'test-key',
    system:'Gebruik de bron.',
    fetchImpl,
    usageStore,
    requestId:'CTX-WEBSITE-1',
    usageContext:{
      tenantId:'SHOULD_NOT_OVERRIDE_PUBLIC',
      activityType:'SHOULD_NOT_OVERRIDE_WEBSITE_QA',
      actionId:'22222222-2222-2222-2222-222222222222',
      opportunityKey:'opp-web-1',
      campaignKey:'camp-web-1',
      outcomeKey:'out-web-1',
      prompt:'must-not-flow',
    },
  });

  assert.equal(result.tokenMetering, 'RECORDED');
  assert.equal(result.canonicalTokenMetering, 'RECORDED');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].context, {
    tenantId:'PUBLIC',
    activityType:'website_qa',
    actionId:'22222222-2222-2222-2222-222222222222',
    opportunityKey:'opp-web-1',
    campaignKey:'camp-web-1',
    outcomeKey:'out-web-1',
    prompt:'must-not-flow',
  });
});
