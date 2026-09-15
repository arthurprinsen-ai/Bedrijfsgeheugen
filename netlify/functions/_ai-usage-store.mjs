import { getStore } from '@netlify/blobs';
import { aggregateTokenUsage, tokenUsageMonth } from '../../platform/cost/ai-token-usage.mjs';

const STORE_NAME = 'brain-ai-usage';
const KEY_PREFIX = 'usage/';

function eventKey(record) {
  const month = tokenUsageMonth(record.at);
  return `${KEY_PREFIX}${month}/${encodeURIComponent(record.requestId)}`;
}

function createCanonicalWriter({
  fetchFn=globalThis.fetch,
  baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,
  serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN,
}={}) {
  if (typeof fetchFn !== 'function' || !baseUrl || !serviceToken) return null;
  const endpoint=`${String(baseUrl).replace(/\/$/,'')}/functions/v1/resource-usage-eu`;
  return async record => {
    const response=await fetchFn(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
      body:JSON.stringify({action:'record',usage:{
        usageId:`ai:${record.requestId}`,
        capabilityId:record.componentKey,
        source:record.provider,
        providerModelId:record.providerModelId,
        providerUsageId:record.requestId,
        usageType:'ai_tokens',
        unit:'tokens',
        amount:record.totalTokens,
        occurredAt:record.at,
        measurementClass:'provider_reported',
        metadata:{input_tokens:record.inputTokens,output_tokens:record.outputTokens,cache_read_tokens:record.cacheReadTokens,cache_write_tokens:record.cacheWriteTokens}
      }})
    });
    if(!response.ok) throw new Error(`canonical AI usage mirror failed (${response.status})`);
    return response.json().catch(()=>({}));
  };
}

export function createAiUsageStore(
  store = getStore({ name: STORE_NAME, consistency: 'strong' }),
  { now = () => new Date().toISOString(), timezone = 'Europe/Amsterdam', canonicalWriter = createCanonicalWriter() } = {}
) {
  if (typeof store?.setJSON !== 'function' || typeof store?.get !== 'function' || typeof store?.list !== 'function') throw new TypeError('valid blob store is required');
  return Object.freeze({
    async record(record) {
      await store.setJSON(eventKey(record), record);
      let canonicalRecorded=false;
      let canonicalError=null;
      if(typeof canonicalWriter==='function'){
        try{await canonicalWriter(record);canonicalRecorded=true;}
        catch(error){canonicalError=String(error?.message||error).slice(0,200);}
      }
      return { recorded:true, canonicalRecorded, canonicalError, requestId:record.requestId };
    },
    async monthly({ monthlyLimitTokens = 10_000 } = {}) {
      const month = tokenUsageMonth(now(), timezone);
      const { blobs = [] } = await store.list({ prefix: `${KEY_PREFIX}${month}/` });
      const records = (await Promise.all(blobs.map(blob => store.get(blob.key, { type: 'json', consistency: 'strong' })))).filter(Boolean);
      return aggregateTokenUsage(records, { monthlyLimitTokens, now: now(), timezone });
    },
  });
}

export { STORE_NAME as AI_USAGE_STORE_NAME, KEY_PREFIX as AI_USAGE_KEY_PREFIX, createCanonicalWriter as createCanonicalAiUsageWriter };
