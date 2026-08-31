const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const uniq=xs=>[...new Set((xs||[]).filter(Boolean).map(String))];

export function evaluateDecisionScenarios(decision,alternatives,{hardConstraints=[]}={}){
  if(!decision?.id||!decision?.tenantId) throw new TypeError('decision identity required');
  if(!Array.isArray(alternatives)||alternatives.length===0) throw new TypeError('decision alternatives required');
  const weights={value:.5,risk:.3,time:.2,...(decision.payload?.objectiveWeights||{})};
  const total=Math.max(.000001,Number(weights.value||0)+Number(weights.risk||0)+Number(weights.time||0));
  const scenarios=alternatives.map(alt=>{
    if(!alt?.id) throw new TypeError('alternative id required');
    const eligible=hardConstraints.every(fn=>typeof fn==='function'?fn(alt)!==false:true);
    const value=clamp(alt.value),risk=clamp(alt.risk),time=clamp(alt.time);
    const score=eligible?((value*Number(weights.value||0))+((1-risk)*Number(weights.risk||0))+(time*Number(weights.time||0)))/total:-1;
    return Object.freeze({id:String(alt.id),label:alt.label||String(alt.id),eligible,value,risk,time,score:Number(score.toFixed(6)),evidenceIds:uniq([...(decision.evidenceIds||[]),...(alt.evidenceIds||[])]),assumptions:Object.freeze([...(alt.assumptions||[])])});
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return Object.freeze({schemaVersion:'brain-decision-evaluation.v1',decisionId:String(decision.id),tenantId:String(decision.tenantId),subjectId:decision.subjectId||null,correlationId:decision.correlationId||null,owner:decision.owner||'UNASSIGNED',scenarios:Object.freeze(scenarios),recommendedScenarioId:scenarios.find(x=>x.eligible)?.id||null});
}

export function selectDecisionScenario(evaluated,{scenarioId,selectedBy,rationale,selectedAt=new Date().toISOString()}={}){
  if(!evaluated?.decisionId||!Array.isArray(evaluated.scenarios)) throw new TypeError('evaluated decision required');
  const scenario=evaluated.scenarios.find(x=>x.id===String(scenarioId));
  if(!scenario) throw new Error('selected scenario not found');
  if(!scenario.eligible) throw new Error('selected scenario is not eligible');
  if(!selectedBy) throw new TypeError('selectedBy required');
  if(!String(rationale||'').trim()) throw new Error('selection rationale required');
  return Object.freeze({schemaVersion:'brain-decision-selection.v1',decisionId:evaluated.decisionId,tenantId:evaluated.tenantId,correlationId:evaluated.correlationId||null,selectedScenarioId:scenario.id,selectedBy:String(selectedBy),rationale:String(rationale).trim(),selectedAt,status:'SELECTED',evidenceIds:Object.freeze([...(scenario.evidenceIds||[])])});
}
