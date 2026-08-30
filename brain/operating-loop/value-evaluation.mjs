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
