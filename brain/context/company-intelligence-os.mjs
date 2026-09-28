const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):0;

export const COMPANY_INTELLIGENCE_OS_CONTRACT=freeze({
  version:'POWERHOUSE-COMPANY-INTELLIGENCE-OS-v1',
  loop:['know','understand','decide','act','measure','learn'],
  crmRole:'source-not-brain',
  invariants:[
    'NO_PARALLEL_CRM','NO_PARALLEL_LEARNING_STORE','EVIDENCE_FIRST','CONTEXT_BEFORE_ACTION',
    'ACTION_REQUIRES_LINEAGE','OUTCOME_REQUIRES_ORIGIN','REALIZED_VALUE_IS_OBSERVED_NOT_SYNTHESIZED',
    'LEARNING_UPDATES_SHARED_POLICY','PROVENANCE_FRESHNESS_CONFIDENCE_REQUIRED'
  ]
});

export function buildCompanyGraph({people=[],companies=[],opportunities=[],actions=[],outcomes=[]}={}){
  const nodes=[];
  const edges=[];
  for(const company of arr(companies)){
    if(!company?.company_key)continue;
    nodes.push({type:'company',key:company.company_key,label:company.company_name||company.company_key,payload:company});
  }
  for(const person of arr(people)){
    if(!person?.person_key)continue;
    nodes.push({type:'person',key:person.person_key,label:person.person_name||person.person_key,payload:person});
    if(person.company_key)edges.push({type:'person_company',from:person.person_key,to:person.company_key});
  }
  for(const opportunity of arr(opportunities)){
    if(!opportunity?.opportunity_key)continue;
    nodes.push({type:'opportunity',key:opportunity.opportunity_key,label:opportunity.opportunity_key,payload:opportunity});
    if(opportunity.company_key)edges.push({type:'company_opportunity',from:opportunity.company_key,to:opportunity.opportunity_key});
    if(opportunity.person_key)edges.push({type:'person_opportunity',from:opportunity.person_key,to:opportunity.opportunity_key});
  }
  for(const action of arr(actions)){
    if(!action?.action_id)continue;
    const key=String(action.action_id);
    nodes.push({type:'action',key,label:action.action_type||key,payload:action});
    if(action.opportunity_key)edges.push({type:'opportunity_action',from:action.opportunity_key,to:key});
  }
  for(const outcome of arr(outcomes)){
    if(!outcome?.outcome_id)continue;
    const key=String(outcome.outcome_id);
    nodes.push({type:'outcome',key,label:outcome.outcome_type||key,payload:outcome});
    if(outcome.action_id)edges.push({type:'action_outcome',from:String(outcome.action_id),to:key});
  }
  return freeze({schemaVersion:'company-graph.v1',nodes,edges});
}

export function compileSystemOfContext({companyKey,graph,evidence=[],businessContext={},signals=[],forecasts=[]}={}){
  if(!companyKey)throw new Error('companyKey is required');
  const companyNodes=arr(graph?.nodes).filter(n=>n?.payload?.company_key===companyKey||n?.key===companyKey);
  const relevantKeys=new Set(companyNodes.map(n=>n.key));
  for(const edge of arr(graph?.edges)){
    if(relevantKeys.has(edge.from))relevantKeys.add(edge.to);
    if(relevantKeys.has(edge.to))relevantKeys.add(edge.from);
  }
  const nodes=arr(graph?.nodes).filter(n=>relevantKeys.has(n.key));
  return freeze({
    schemaVersion:'system-of-context.v1',
    companyKey,
    graph:{nodes,edges:arr(graph?.edges).filter(e=>relevantKeys.has(e.from)&&relevantKeys.has(e.to))},
    businessContext,
    evidence:arr(evidence),
    signals:arr(signals),
    forecasts:arr(forecasts),
    truthBoundary:'Derived context over canonical evidence; not a parallel truth store.'
  });
}

export function selectAutonomousActions({context,actions=[]}={}){
  return freeze(arr(actions).map(action=>{
    const ready=['prepared','suggested','waiting'].includes(action?.status) && (!action?.due_at||new Date(action.due_at)<=new Date());
    return {
      ...action,
      executionCandidate:ready,
      contextBound:Boolean(context?.companyKey),
      requiresExistingExecutionGates:true
    };
  }));
}

export function buildOutcomeMemory({outcomes=[],realizedValues=[]}={}){
  return freeze({
    schemaVersion:'outcome-memory.v1',
    records:[
      ...arr(outcomes).map(o=>({type:'outcome',id:o.outcome_id||o.id,origin:o.action_id||null,class:o.outcome_type||null,value:num(o.revenue_eur),unit:'EUR',observedAt:o.occurred_at||null,evidence:o.evidence||{}})),
      ...arr(realizedValues).map(v=>({type:'realized_value',id:v.observation_id||v.id,origin:v.cycle_id||null,class:v.value_type||null,value:num(v.numeric_value),unit:v.currency||v.unit||null,observedAt:v.observed_at||null,evidence:{evidence_ref:v.evidence_ref,provenance:v.provenance||{}}}))
    ]
  });
}

export function compoundIntelligence({context,outcomeMemory,actions=[]}={}){
  const records=arr(outcomeMemory?.records);
  const revenue=records.filter(r=>r.class==='revenue'||r.unit==='EUR').reduce((sum,r)=>sum+num(r.value),0);
  const observed=records.length;
  const executed=arr(actions).filter(a=>a?.status==='done'||a?.executed_at).length;
  const nextLearningMove=revenue>0?'reinforce_verified_value_path':observed>0?'learn_from_non_revenue_outcomes':executed>0?'measure_or_adjust_action_policy':'enrich_and_observe';
  return freeze({
    schemaVersion:'compound-intelligence-loop.v1',
    companyKey:context?.companyKey||null,
    loop:COMPANY_INTELLIGENCE_OS_CONTRACT.loop,
    observedOutcomes:observed,
    realizedRevenueEur:revenue,
    executedActions:executed,
    nextLearningMove,
    rule:'Every next decision consumes verified outcomes and realized value where available.'
  });
}
