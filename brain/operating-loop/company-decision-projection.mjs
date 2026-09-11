import {buildCompanyLedger} from './company-ledger.mjs';

const BUCKETS=['NOW','NEXT','LATER','DO_NOT_DO'];
const num=v=>Number.isFinite(Number(v))?Number(v):0;

function projectDecision(record){
  const payload=record.payload||{};
  const bucket=BUCKETS.includes(payload.portfolioBucket)?payload.portfolioBucket:null;
  return {
    id:record.id,
    subjectId:record.subjectId,
    title:payload.title||payload.recommendation||record.result||record.subjectId,
    status:record.status,
    owner:record.owner,
    actor:record.actor,
    score:payload.score==null?null:num(payload.score),
    rank:payload.rank==null?null:num(payload.rank),
    portfolioBucket:bucket,
    reasons:Array.isArray(payload.reasons)?payload.reasons:[],
    blockedBy:payload.blockedBy||null,
    dependencyState:payload.dependencyState||null,
    dependencies:Array.isArray(payload.dependencies)?payload.dependencies:[],
    confidence:payload.confidence==null?null:num(payload.confidence),
    nextAction:payload.nextAction||payload.recommendation||null,
    expectedValue:num(record.economics?.expectedValue),
    investment:num(record.economics?.cost),
    realizedValue:num(record.economics?.realizedValue),
    currency:record.economics?.currency||'EUR',
    evidenceIds:[...(record.evidenceIds||[])],
    observedAt:record.observedAt,
    correlationId:record.correlationId||null
  };
}

export function buildCompanyDecisionProjection(records,{tenantId}={}){
  const scoped=(Array.isArray(records)?records:[]).filter(r=>!tenantId||r?.tenantId===tenantId);
  const ledger=buildCompanyLedger(scoped,{tenantId});
  const companyDecisions=scoped.filter(r=>r.kind==='decision').map(projectDecision)
    .sort((a,b)=>(a.rank??Number.MAX_SAFE_INTEGER)-(b.rank??Number.MAX_SAFE_INTEGER)||String(b.observedAt).localeCompare(String(a.observedAt)));
  const priorityPortfolio=Object.fromEntries(BUCKETS.map(bucket=>[bucket,companyDecisions.filter(d=>d.portfolioBucket===bucket)]));
  const approvalQueue=ledger.approvals.filter(item=>['PENDING','REQUESTED'].includes(item.approval?.state)).map(item=>({
    id:item.id,decisionId:item.decisionId,subjectId:item.subjectId,status:item.status,approval:item.approval,actor:item.actor,owner:item.owner,occurredAt:item.occurredAt,evidenceIds:item.evidenceIds
  }));
  return {
    companyDecisions,
    priorityPortfolio,
    decisionEconomics:ledger.economics,
    approvalQueue,
    auditTimeline:ledger.timeline,
    actors:ledger.actors
  };
}

export {BUCKETS};
