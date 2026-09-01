const HORIZONS=Object.freeze([30,90,180]);
const DAY_MS=24*60*60*1000;
const clean=v=>String(v??'').trim();
const unique=values=>[...new Set((Array.isArray(values)?values:[]).map(clean).filter(Boolean))];
const iso=value=>{const time=Date.parse(value);if(Number.isNaN(time)) throw new TypeError('invalid date');return new Date(time).toISOString();};

export function scheduleOutcomeHorizons(outcome,{now}={}){
  if(outcome?.type!=='Outcome'||!outcome.id||!outcome.tenantId||outcome.verified!==true||outcome.executed!==true) throw new Error('schedule requires verified Outcome');
  const baseAt=iso(outcome.observedAt||now||new Date().toISOString());
  const baseMs=Date.parse(baseAt);
  return Object.freeze(HORIZONS.map(horizonDays=>Object.freeze({
    id:`value-eval:${clean(outcome.tenantId)}:${clean(outcome.id)}:${horizonDays}`,
    tenantId:clean(outcome.tenantId),outcomeId:clean(outcome.id),owner:clean(outcome.owner)||'UNASSIGNED',horizonDays,
    scheduledAt:baseAt,dueAt:new Date(baseMs+horizonDays*DAY_MS).toISOString(),status:'PENDING',verified:false,value:null,
    evidenceIds:unique(outcome.evidenceIds),idempotencyKey:`outcome-horizon:${clean(outcome.tenantId)}:${clean(outcome.id)}:${horizonDays}`
  })));
}

export function evaluateOutcomeHorizon(evaluation,{now=new Date().toISOString(),evidence=[],result=null,realisedValue=0,valueUnit='count'}={}){
  if(!evaluation?.id||!evaluation?.tenantId||!evaluation?.outcomeId||!HORIZONS.includes(Number(evaluation.horizonDays))) throw new TypeError('invalid outcome horizon evaluation');
  const observedAt=iso(now);const dueMs=Date.parse(evaluation.dueAt);if(Number.isNaN(dueMs)) throw new TypeError('invalid due date');
  const base={...evaluation,lastEvaluatedAt:observedAt,verified:false,value:null};
  if(Date.parse(observedAt)<dueMs) return Object.freeze({...base,status:'PENDING'});
  const evidenceIds=unique(evidence);
  if(evidenceIds.length===0){return Object.freeze({...base,status:'WAITING_FOR_EVIDENCE',owner:clean(evaluation.owner)||'UNASSIGNED',nextEvaluationAt:new Date(Date.parse(observedAt)+DAY_MS).toISOString(),evidenceIds:unique(evaluation.evidenceIds)});}
  if(result===null||result===undefined||clean(result)==='') throw new Error('verified horizon evaluation requires result');
  const value=Object.freeze({
    tenantId:evaluation.tenantId,type:'Value',kind:'value',id:`value:${evaluation.tenantId}:${evaluation.outcomeId}:${evaluation.horizonDays}`,
    outcomeId:evaluation.outcomeId,predecessorIds:Object.freeze([evaluation.outcomeId]),owner:clean(evaluation.owner)||'UNASSIGNED',status:'REALISED',executed:true,verified:true,
    result,evidenceIds:Object.freeze(evidenceIds),payload:Object.freeze({realised:true,realisedValue:Number(realisedValue)||0,valueUnit:clean(valueUnit)||'count',horizonDays:Number(evaluation.horizonDays),evaluatedAt:observedAt})
  });
  return Object.freeze({...base,status:'VERIFIED',verified:true,evidenceIds:Object.freeze(evidenceIds),value});
}

export const OUTCOME_HORIZONS=HORIZONS;
