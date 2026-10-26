const safeTime=v=>{const t=Date.parse(v);return Number.isFinite(t)?t:null;};

// A source PROVEN string is not evidence. The canonical tenant projection
// requires a real verified outcome and immutable evidence rows in this same tenant.
export function verifiedMemoryOutcome(record,records) {
  if(record?.kind!=='memory'||record?.status!=='PROVEN'||record?.verified!==true) return null;
  const tenant=String(record.tenantId||'');
  if(!tenant) return null;
  const evidenceIds=new Set((record.evidenceIds||[]).filter(x=>typeof x==='string'&&x.trim()));
  if(!evidenceIds.size) return null;
  const evidenceFound=(records||[]).some(x=>x?.kind==='evidence'&&x.tenantId===tenant&&
    x.verified===true&&evidenceIds.has(x.id));
  if(!evidenceFound) return null;
  const references=new Set([...(record.predecessorIds||[]),record.payload?.outcomeId,record.payload?.verifiedOutcomeId].filter(Boolean));
  if(!references.size) return null;
  const outcome=(records||[]).find(x=>x?.kind==='outcome'&&x.tenantId===tenant&&references.has(x.id)&&
    x.executed===true&&x.verified===true&&x.owner&&x.owner!=='UNASSIGNED'&&
    x.result!==null&&x.result!==undefined&&x.result!==''&&
    Array.isArray(x.evidenceIds)&&x.evidenceIds.length>0&&
    x.evidenceIds.some(id=>evidenceIds.has(id)));
  return outcome?{outcomeId:String(outcome.id),evidenceIds:[...evidenceIds].sort()}:null;
}


export function projectLivingMemory(records,{now=new Date().toISOString(),defaultMaxAgeMs=86400000,maxAgeBySource={}}={}){
  const nowMs=safeTime(now);if(nowMs===null) throw new TypeError('Living Memory now must be valid ISO timestamp');
  const projected=(Array.isArray(records)?records:[]).map(record=>{
    const source=record?.provenance?.source||'unknown';const observed=safeTime(record?.observedAt);const maxAge=Math.max(0,Number(maxAgeBySource[source]??defaultMaxAgeMs)||0);
    const ageMs=observed===null?null:Math.max(0,nowMs-observed);
    const status=observed===null?'unknown':ageMs<=maxAge?'fresh':'stale';
    const memoryProof=record?.kind==='memory'&&record?.status==='PROVEN'
      ?verifiedMemoryOutcome(record,records):null;
    const proofUnverified=record?.kind==='memory'&&record?.status==='PROVEN'&&!memoryProof;
    return Object.freeze({...record,
      // Projection-only downgrade. Never rewrite the canonical stored record.
      ...(proofUnverified?{status:'REVIEW_REQUIRED'}:{}),
      ...(record?.kind==='memory'?{proof:Object.freeze({
        state:memoryProof?'PROVEN':'REVIEW_REQUIRED',
        outcomeId:memoryProof?.outcomeId||null,
        evidenceIds:memoryProof?.evidenceIds||[]
      })}:{}),
      provenance:{...(record.provenance||{}),source,sourceId:record?.provenance?.sourceId||record?.id||'unknown'},
      freshness:{status,ageMs,maxAgeMs:maxAge,observedAt:record?.observedAt||null}
    });
  });
  const memories=projected.filter(record=>record?.kind==='memory');
  const summary={fresh:0,stale:0,unknown:0};for(const record of projected) summary[record.freshness.status]++;
  const memorySummary={fresh:0,stale:0,unknown:0};for(const record of memories) memorySummary[record.freshness.status]++;
  return Object.freeze({records:projected,memories,summary,memorySummary});
}
