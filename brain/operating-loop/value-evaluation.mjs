const HORIZONS=[30,90,180];
const DAY_MS=86400000;
export function buildValueEvaluationSchedule(outcome){
  if(!outcome?.id||!outcome?.tenantId) throw new TypeError('value schedule requires outcome identity');
  if(outcome.verified!==true) throw new Error('value schedule requires verified outcome');
  const base=Date.parse(outcome.observedAt);if(!Number.isFinite(base)) throw new TypeError('value schedule requires valid observedAt');
  return HORIZONS.map(days=>Object.freeze({outcomeId:String(outcome.id),tenantId:String(outcome.tenantId),days,dueAt:new Date(base+(days*DAY_MS)).toISOString(),status:'PENDING'}));
}
export function dueValueEvaluations(schedule,{now=new Date().toISOString(),completedDays=[]}={}){
  const t=Date.parse(now);if(!Number.isFinite(t)) throw new TypeError('now must be valid ISO timestamp');const completed=new Set(completedDays.map(Number));
  return schedule.filter(item=>!completed.has(Number(item.days))&&Date.parse(item.dueAt)<=t);
}

const freezeItems=items=>Object.freeze(items.map(item=>Object.freeze({...item,evidenceIds:Object.freeze([...(item.evidenceIds||[])])})));
const createLedgerState=(outcome,items,claims=[])=>Object.freeze({
  outcome:Object.freeze({...outcome}),
  items:freezeItems(items),
  claims:freezeItems(claims),
  claimDue({now=new Date().toISOString(),workerId}={}){
    if(!workerId) throw new TypeError('claim requires workerId');
    const due=dueValueEvaluations(items,{now,completedDays:items.filter(item=>item.status==='COMPLETED').map(item=>item.days)}).filter(item=>item.status==='PENDING');
    const claim=due[0];
    if(!claim) return createLedgerState(outcome,items,[]);
    const claimed={...claim,status:'CLAIMED',workerId:String(workerId),claimedAt:now,evidenceIds:claim.evidenceIds||[]};
    const next=items.map(item=>item.days===claim.days?claimed:item);
    return createLedgerState(outcome,next,[claimed]);
  },
  complete({days,evidenceIds,result}={}){
    if(!Array.isArray(evidenceIds)||evidenceIds.length===0) throw new Error('completion requires evidence');
    const horizon=Number(days); const current=items.find(item=>item.days===horizon);
    if(!current) throw new Error('unknown evaluation horizon');
    const completed={...current,status:'COMPLETED',evidenceIds:[...evidenceIds],result:result??null};
    return createLedgerState(outcome,items.map(item=>item.days===horizon?completed:item),claims);
  }
});

export function createOutcomeEvaluationLedger(outcome){
  const schedule=buildValueEvaluationSchedule(outcome).map(item=>({...item,evidenceIds:[]}));
  return createLedgerState(outcome,schedule,[]);
}
