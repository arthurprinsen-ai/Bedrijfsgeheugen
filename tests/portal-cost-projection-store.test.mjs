import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('node_modules/@netlify/blobs', { recursive: true });
await writeFile('node_modules/@netlify/blobs/package.json', JSON.stringify({ name:'@netlify/blobs', type:'module', exports:'./index.js' }));
await writeFile('node_modules/@netlify/blobs/index.js', 'export function getStore(){ throw new Error("default Netlify store must not be used by injected tests"); }\n');

const { createCostProjectionStore } = await import('../netlify/functions/_cost-projection-store.mjs');

const blobRecord = {
  schemaVersion: 1,
  sourceUpdatedAt: '2026-08-30T20:00:00.000Z',
  budget: { usedCredits: 100, state: 'GREEN' },
  components: [],
};

const usageRecord = {
  monthlyLimitTokens: 10_000,
  usedTokens: 100,
  remainingTokens: 9_900,
  tokensToday: 10,
  dailyTokenAllowance: 100,
  tokenPaceRatio: 0.1,
  tokenState: 'GREEN',
  coverage: 'PARTIAL',
  components: [],
};

test('valid blob hit does not call Notion and still enriches token usage', async () => {
  let notionReads = 0;
  const store = {
    async get() { return blobRecord; },
    async setJSON() {},
  };
  const notionSource = {
    async get() {
      notionReads += 1;
      return { ...blobRecord, sourceUpdatedAt: '2026-08-30T21:00:00.000Z' };
    },
  };
  const aiUsageSource = { async monthly() { return usageRecord; } };

  const projection = await createCostProjectionStore(store, notionSource, aiUsageSource).get();

  assert.equal(notionReads, 0);
  assert.equal(projection.sourceUpdatedAt, blobRecord.sourceUpdatedAt);
  assert.equal(projection.budget.usedTokens, 100);
});

test('missing blob falls back to Notion exactly once', async () => {
  let notionReads = 0;
  const notionRecord = { ...blobRecord, sourceUpdatedAt: '2026-08-30T21:00:00.000Z' };
  const store = {
    async get() { return null; },
    async setJSON() {},
  };
  const notionSource = {
    async get() {
      notionReads += 1;
      return notionRecord;
    },
  };
  const aiUsageSource = { async monthly() { return usageRecord; } };

  const projection = await createCostProjectionStore(store, notionSource, aiUsageSource).get();

  assert.equal(notionReads, 1);
  assert.equal(projection.sourceUpdatedAt, notionRecord.sourceUpdatedAt);
  assert.equal(projection.budget.usedTokens, 100);
});
