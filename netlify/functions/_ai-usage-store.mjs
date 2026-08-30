import { getStore } from '@netlify/blobs';
import { aggregateTokenUsage, tokenUsageMonth } from '../../platform/cost/ai-token-usage.mjs';

const STORE_NAME = 'brain-ai-usage';
const KEY_PREFIX = 'usage/';

function eventKey(record) {
  const month = tokenUsageMonth(record.at);
  return `${KEY_PREFIX}${month}/${encodeURIComponent(record.requestId)}`;
}

export function createAiUsageStore(store = getStore({ name: STORE_NAME, consistency: 'strong' }), { now = () => new Date().toISOString(), timezone = 'Europe/Amsterdam' } = {}) {
  if (typeof store?.setJSON !== 'function' || typeof store?.get !== 'function' || typeof store?.list !== 'function') throw new TypeError('valid blob store is required');
  return Object.freeze({
    async record(record) {
      await store.setJSON(eventKey(record), record);
      return { recorded: true, requestId: record.requestId };
    },
    async monthly({ monthlyLimitTokens = 10_000 } = {}) {
      const month = tokenUsageMonth(now(), timezone);
      const { blobs = [] } = await store.list({ prefix: `${KEY_PREFIX}${month}/` });
      const records = (await Promise.all(blobs.map(blob => store.get(blob.key, { type: 'json', consistency: 'strong' })))).filter(Boolean);
      return aggregateTokenUsage(records, { monthlyLimitTokens, now: now(), timezone });
    },
  });
}

export { STORE_NAME as AI_USAGE_STORE_NAME, KEY_PREFIX as AI_USAGE_KEY_PREFIX };
