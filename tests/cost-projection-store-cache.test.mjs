import test from 'node:test';
import assert from 'node:assert/strict';
import { createCostProjectionStore, COST_PROJECTION_STORE_KEY } from '../netlify/functions/_cost-projection-store.mjs';

function fakeBlob(initial = null) {
  let value = initial;
  let writes = 0;
  return {
    async get(key) { assert.equal(key, COST_PROJECTION_STORE_KEY); return value; },
    async setJSON(key, next) { assert.equal(key, COST_PROJECTION_STORE_KEY); value = next; writes += 1; },
    current: () => value,
    writes: () => writes,
  };
}

test('fresh projection cache avoids a Notion query', async () => {
  const now = '2026-08-30T18:30:00.000Z';
  const blob = fakeBlob({ sourceUpdatedAt: '2026-08-30T17:00:00.000Z', projectionCacheCheckedAt: '2026-08-30T18:20:00.000Z', totals: { creditsTotal: 10 } });
  let notionCalls = 0;
  const store = createCostProjectionStore(blob, { get: async () => { notionCalls += 1; return null; } }, { now: () => now, revalidateMs: 15 * 60 * 1000 });
  const record = await store.get();
  assert.equal(notionCalls, 0);
  assert.equal(record.totals.creditsTotal, 10);
});

test('cache miss queries Notion once and persists the projection', async () => {
  const now = '2026-08-30T18:30:00.000Z';
  const blob = fakeBlob();
  let notionCalls = 0;
  const notionRecord = { sourceUpdatedAt: '2026-08-30T18:25:00.000Z', totals: { creditsTotal: 11 } };
  const store = createCostProjectionStore(blob, { get: async () => { notionCalls += 1; return notionRecord; } }, { now: () => now });
  const record = await store.get();
  assert.equal(notionCalls, 1);
  assert.equal(record.totals.creditsTotal, 11);
  assert.equal(blob.writes(), 1);
  assert.equal(blob.current().projectionCacheCheckedAt, now);
});

test('stale cache revalidates and keeps the newest source record', async () => {
  const now = '2026-08-30T18:30:00.000Z';
  const blob = fakeBlob({ sourceUpdatedAt: '2026-08-30T18:00:00.000Z', projectionCacheCheckedAt: '2026-08-30T18:00:00.000Z', totals: { creditsTotal: 10 } });
  const notionRecord = { sourceUpdatedAt: '2026-08-30T18:25:00.000Z', totals: { creditsTotal: 12 } };
  let notionCalls = 0;
  const store = createCostProjectionStore(blob, { get: async () => { notionCalls += 1; return notionRecord; } }, { now: () => now });
  const record = await store.get();
  assert.equal(notionCalls, 1);
  assert.equal(record.totals.creditsTotal, 12);
  assert.equal(blob.current().projectionCacheCheckedAt, now);
});

test('failed revalidation serves last-known-good and throttles repeated Notion calls', async () => {
  let currentNow = '2026-08-30T18:30:00.000Z';
  const blob = fakeBlob({ sourceUpdatedAt: '2026-08-30T17:00:00.000Z', projectionCacheCheckedAt: '2026-08-30T18:00:00.000Z', totals: { creditsTotal: 9 } });
  let notionCalls = 0;
  const store = createCostProjectionStore(blob, { get: async () => { notionCalls += 1; return null; } }, { now: () => currentNow, revalidateMs: 15 * 60 * 1000 });
  const first = await store.get();
  assert.equal(first.totals.creditsTotal, 9);
  assert.equal(notionCalls, 1);
  assert.equal(blob.current().projectionCacheCheckedAt, currentNow);
  currentNow = '2026-08-30T18:35:00.000Z';
  const second = await store.get();
  assert.equal(second.totals.creditsTotal, 9);
  assert.equal(notionCalls, 1);
});
