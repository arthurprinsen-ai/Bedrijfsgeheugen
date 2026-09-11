const num=value=>Number.isFinite(Number(value))?Number(value):0;
const text=value=>value==null?'':String(value).trim();

function latestForDecision(items,decisionId){
  return (Array.isArray(items)?items:[])
    .filter(item=>item?.decisionId===decisionId)
    .slice()
    .sort((a,b)=>String(b.occurredAt||b.observedAt||'').localeCompare(String(a.occurredAt||a.observedAt||'')))[0]||null;
}

export function buildNotionDecisionRows(projection={}){
  const tenantId=text(projection.tenantId);
  const economics=projection.decisionEconomics||{};
  return (Array.isArray(projection.companyDecisions)?projection.companyDecisions:[]).map(decision=>{
    const approval=latestForDecision(projection.approvalQueue,decision.id);
    const lastEvent=latestForDecision(projection.auditTimeline,decision.id);
    return Object.freeze({
      fingerprint:`${tenantId}:${decision.id}`,
      tenantId,
      decisionId:decision.id,
      sourceOfTruth:'BRAIN_SUPABASE',
      subjectId:decision.subjectId||null,
      title:decision.title||decision.id,
      status:decision.status||null,
      owner:decision.owner||null,
      portfolioBucket:decision.portfolioBucket||decision.bucket||null,
      rank:decision.rank??null,
      score:decision.score??null,
      confidence:decision.confidence??null,
      nextAction:decision.nextAction||null,
      expectedValue:num(decision.expectedValue),
      expectedCost:num(decision.expectedCost??decision.investment),
      realizedValue:num(decision.realizedValue),
      realizedProfit:num(economics.realizedProfit),
      currency:decision.currency||economics.currency||'EUR',
      approvalState:approval?.approvalState||approval?.approval?.state||approval?.status||'NONE',
      approvedBy:approval?.approvedBy||approval?.actor||null,
      approvalOccurredAt:approval?.occurredAt||null,
      evidenceIds:[...(decision.evidenceIds||[])],
      lastEvent:lastEvent?Object.freeze({...lastEvent}):null
    });
  });
}

export async function syncCompanyDecisionsToNotion(projection,{writer}={}){
  if(typeof writer?.upsert!=='function') throw new TypeError('Notion company decision sync requires writer.upsert');
  const rows=buildNotionDecisionRows(projection);
  const errors=[];
  const results=[];
  for(const row of rows){
    try{results.push(await writer.upsert(row));}
    catch(error){errors.push({decisionId:row.decisionId,fingerprint:row.fingerprint,message:error?.message||String(error)});}
  }
  return Object.freeze({attempted:rows.length,succeeded:results.length,failed:errors.length,errors,results});
}
