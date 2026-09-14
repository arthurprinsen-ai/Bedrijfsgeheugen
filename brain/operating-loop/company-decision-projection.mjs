import {buildCompanyLedger} from './company-ledger.mjs';
import {buildRevenueCalibrationContext} from '../learning/company-revenue-learning-bridge.mjs';

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

function projectRevenuePredictions(records){
  const settledPredictionIds=new Set(records
    .filter(r=>r.kind==='learning'&&r.payload?.learningType==='revenue_settlement')
    .map(r=>r.payload?.originatingPredictionId)
    .filter(Boolean));
  const predictions=records
    .filter(r=>r.kind==='learning'&&r.payload?.learningType==='revenue_prediction'&&r.payload?.prediction?.decision_id)
    .sort((a,b)=>String(b.observedAt).localeCompare(String(a.observedAt)));
  const latest=new Map();
  for(const record of predictions){
    if(!latest.has(record.decisionId)) latest.set(record.decisionId,record);
  }
  return [...latest.values()].map(record=>({
    id:record.id,
    tenantId:record.tenantId,
    decisionId:record.decisionId,
    subjectId:record.subjectId,
    owner:record.owner,
    status:settledPredictionIds.has(record.id)?'SETTLED':'OPEN',
    observedAt:record.observedAt,
    evidenceIds:[...(record.evidenceIds||[])],
    prediction:record.payload.prediction,
  }));
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
  const revenuePredictions=projectRevenuePredictions(scoped);
  const revenueCalibration=buildRevenueCalibrationContext(scoped);
  return {
    companyDecisions,
    priorityPortfolio,
    decisionEconomics:ledger.economics,
    approvalQueue,
    auditTimeline:ledger.timeline,
    actors:ledger.actors,
    revenuePredictions,
    revenueCalibration,
    nextDecisionContext:revenueCalibration.next_decision_context
  };
}

export {BUCKETS};
