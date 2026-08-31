const safeTime=v=>{const t=Date.parse(v);return Number.isFinite(t)?t:null;};

export function projectLivingMemory(records,{now=new Date().toISOString(),defaultMaxAgeMs=86400000,maxAgeBySource={}}={}){
  const nowMs=safeTime(now);if(nowMs===null) throw new TypeError('Living Memory now must be valid ISO timestamp');
  const projected=(Array.isArray(records)?records:[]).map(record=>{
    const source=record?.provenance?.source||'unknown';const observed=safeTime(record?.observedAt);const maxAge=Math.max(0,Number(maxAgeBySource[source]??defaultMaxAgeMs)||0);
    const ageMs=observed===null?null:Math.max(0,nowMs-observed);
    const status=observed===null?'unknown':ageMs<=maxAge?'fresh':'stale';
    return Object.freeze({...record,provenance:{...(record.provenance||{}),source,sourceId:record?.provenance?.sourceId||record?.id||'unknown'},freshness:{status,ageMs,maxAgeMs:maxAge,observedAt:record?.observedAt||null}});
  });
  const memories=projected.filter(record=>record?.kind==='memory');
  const summary={fresh:0,stale:0,unknown:0};for(const record of projected) summary[record.freshness.status]++;
  const memorySummary={fresh:0,stale:0,unknown:0};for(const record of memories) memorySummary[record.freshness.status]++;
  return Object.freeze({records:projected,memories,summary,memorySummary});
}
