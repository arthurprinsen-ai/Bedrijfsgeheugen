const num=v=>Number.isFinite(Number(v))?Number(v):0;
const canonicalProblemId=record=>{
  const candidates=[
    record?.problemId,
    record?.problem_id,
    record?.payload?.problemId,
    record?.payload?.problem_id,
    ...(Array.isArray(record?.references)?record.references:[])
  ].map(v=>String(v??'').trim());
  for(const value of candidates){
    const match=value.match(/(?:problem:)?(PH-P\d{3})/);
    if(match) return match[1];
  }
  return null;
};

function eventView(record){
  return {
    id:record.id,
    type:record.type,
    kind:record.kind,
    subjectId:record.subjectId,
    decisionId:record.decisionId||record.references?.find(x=>String(x).startsWith('decision:'))||null,
    actionId:record.actionId||null,
    problemId:canonicalProblemId(record),
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
  const realizedValueRecords=scoped.filter(r=>r.kind==='value'&&r.verified===true);
  const verifiedValueRecords=realizedValueRecords.filter(r=>r.executed===true&&Array.isArray(r.evidenceIds)&&r.evidenceIds.length>0);
  const realizedValue=realizedValueRecords.reduce((sum,r)=>sum+num(r.economics?.realizedValue??r.payload?.realisedValue),0);
  const valueByProblem={};
  for(const record of verifiedValueRecords){
    const problemId=canonicalProblemId(record);
    if(!problemId) continue;
    if(!valueByProblem[problemId]) valueByProblem[problemId]={problemId,realizedValue:0,evidenceIds:[],outcomes:0};
    valueByProblem[problemId].realizedValue+=num(record.economics?.realizedValue??record.payload?.realisedValue);
    valueByProblem[problemId].evidenceIds.push(...record.evidenceIds);
    valueByProblem[problemId].outcomes+=1;
  }
  const currencies=[...new Set(scoped.map(r=>r.economics?.currency).filter(Boolean))];
  return {
    tenantId:tenantId||null,
    timeline,
    approvals,
    actors,
    verifiedValueByProblem:Object.values(valueByProblem).map(item=>({...item,evidenceIds:[...new Set(item.evidenceIds)]})),
    economics:{
      expectedValue:decisionExpected,
      actualCost,
      realizedValue,
      realizedProfit:realizedValue-actualCost,
      currency:currencies.length===1?currencies[0]:currencies.length?'MIXED':'EUR'
    }
  };
}
