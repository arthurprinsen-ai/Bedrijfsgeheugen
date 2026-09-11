const num=v=>Number.isFinite(Number(v))?Number(v):0;

function eventView(record){
  return {
    id:record.id,
    type:record.type,
    kind:record.kind,
    subjectId:record.subjectId,
    decisionId:record.decisionId||record.references?.find(x=>String(x).startsWith('decision:'))||null,
    actionId:record.actionId||null,
    actor:record.actor,
    actorType:record.actorType,
    owner:record.owner,
    status:record.status,
    occurredAt:record.observedAt,
    approval:record.approval,
    economics:record.economics,
    evidenceIds:record.evidenceIds||[],
    source:record.provenance?.source||'brain',
    sourceId:record.provenance?.sourceId||record.id,
    correlationId:record.correlationId||null
  };
}

export function buildCompanyLedger(records,{tenantId}={}){
  const scoped=(Array.isArray(records)?records:[]).filter(r=>!tenantId||r?.tenantId===tenantId);
  const timeline=scoped.slice().sort((a,b)=>String(b.observedAt||'').localeCompare(String(a.observedAt||''))||String(b.id).localeCompare(String(a.id))).map(eventView);
  const approvals=timeline.filter(x=>x.kind==='approval');
  const actors={};
  for(const event of timeline){
    const key=event.actor||event.owner||'UNASSIGNED';
    if(!actors[key]) actors[key]={actor:key,actorType:event.actorType||'unknown',events:0,lastSeenAt:null};
    actors[key].events+=1;
    if(!actors[key].lastSeenAt||String(event.occurredAt)>String(actors[key].lastSeenAt)) actors[key].lastSeenAt=event.occurredAt;
  }
  const decisionExpected=scoped.filter(r=>r.kind==='decision').reduce((sum,r)=>sum+num(r.economics?.expectedValue),0);
  const actualCost=scoped.filter(r=>['action','execution','outcome','value'].includes(r.kind)).reduce((sum,r)=>sum+num(r.economics?.cost),0);
  const realizedValue=scoped.filter(r=>r.kind==='value'&&r.verified===true).reduce((sum,r)=>sum+num(r.economics?.realizedValue??r.payload?.realisedValue),0);
  const currencies=[...new Set(scoped.map(r=>r.economics?.currency).filter(Boolean))];
  return {
    tenantId:tenantId||null,
    timeline,
    approvals,
    actors,
    economics:{
      expectedValue:decisionExpected,
      actualCost,
      realizedValue,
      realizedProfit:realizedValue-actualCost,
      currency:currencies.length===1?currencies[0]:currencies.length?'MIXED':'EUR'
    }
  };
}
