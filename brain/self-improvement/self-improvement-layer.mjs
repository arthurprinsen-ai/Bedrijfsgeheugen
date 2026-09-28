const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(Number(value))?Number(value):min));
const text=value=>String(value??'').trim();

export const SELF_IMPROVEMENT_CONTRACT=freeze({
  version:'powerhouse-self-improvement-layer.v1',
  northStar:'Powerhouse must function measurably better tomorrow than today without degrading reliability, safety or code quality.',
  loop:['observe','detect','hypothesize','build','test','evaluate','compare','promote','measure','learn'],
  hardRules:[
    'no_learning_without_evidence',
    'no_change_without_evaluation',
    'no_deployment_without_regression_proof',
    'no_intelligence_without_measurable_outcome',
    'no_uncontrolled_self_modification',
    'unknown_is_not_green'
  ]
});

export const DEFAULT_AGENT_OBJECTIVES=freeze([
  {agentId:'revenue',primaryMetric:'realized_revenue_eur',direction:'max',guardrails:['permission','brand','margin','contact_pressure']},
  {agentId:'operations',primaryMetric:'verified_cycle_time_improvement',direction:'max',guardrails:['quality','security','customer_impact']},
  {agentId:'cfo',primaryMetric:'verified_economic_value_eur',direction:'max',guardrails:['cash_truth','margin_truth','forecast_calibration']},
  {agentId:'content',primaryMetric:'verified_pipeline_contribution_eur',direction:'max',guardrails:['semantic_uniqueness','brand','consent']},
  {agentId:'customer',primaryMetric:'verified_retention_or_expansion_value',direction:'max',guardrails:['service_quality','privacy','contact_pressure']},
  {agentId:'engineering',primaryMetric:'verified_quality_velocity_score',direction:'max',guardrails:['security','regression','architecture_health','cost']}
]);

function evidenceCount(item={}){
  return arr(item.evidenceRefs||item.evidence_refs||item.evidence||[]).filter(Boolean).length+
    (item.productionEvidenceRef||item.production_evidence_ref?1:0);
}

export function evaluatePromotionCandidate({
  baseline={},
  candidate={},
  minEvidence=2,
  requiredGates=['quality','security','regression'],
  maxCostRegression=0.15,
  maxLatencyRegression=0.15
}={}){
  const gates={};
  for(const gate of requiredGates){
    const value=candidate?.gates?.[gate];
    gates[gate]=value===true?'pass':value===false?'fail':'unknown';
  }
  const failing=Object.entries(gates).filter(([,v])=>v!=='pass').map(([k])=>k);
  const evidence=evidenceCount(candidate);
  const baseQuality=num(baseline.qualityScore??baseline.quality_score);
  const candQuality=num(candidate.qualityScore??candidate.quality_score);
  const baseBusiness=num(baseline.businessOutcome??baseline.business_outcome);
  const candBusiness=num(candidate.businessOutcome??candidate.business_outcome);
  const baseCost=num(baseline.cost??baseline.cost_per_run);
  const candCost=num(candidate.cost??candidate.cost_per_run);
  const baseLatency=num(baseline.latencyMs??baseline.latency_ms);
  const candLatency=num(candidate.latencyMs??candidate.latency_ms);

  const qualityDelta=baseQuality==null||candQuality==null?null:candQuality-baseQuality;
  const businessDelta=baseBusiness==null||candBusiness==null?null:candBusiness-baseBusiness;
  const costRegression=baseCost==null||candCost==null||baseCost===0?null:(candCost-baseCost)/baseCost;
  const latencyRegression=baseLatency==null||candLatency==null||baseLatency===0?null:(candLatency-baseLatency)/baseLatency;

  const unknownComparisons=[
    ['quality',qualityDelta],['business',businessDelta],['cost',costRegression],['latency',latencyRegression]
  ].filter(([,v])=>v==null).map(([k])=>k);

  const hardReject=
    failing.length>0||
    evidence<minEvidence||
    (qualityDelta!=null&&qualityDelta<0)||
    (costRegression!=null&&costRegression>maxCostRegression)||
    (latencyRegression!=null&&latencyRegression>maxLatencyRegression);

  const improved=(businessDelta!=null&&businessDelta>0)||(qualityDelta!=null&&qualityDelta>0);
  const promotable=!hardReject&&unknownComparisons.length===0&&improved;

  return freeze({
    schemaVersion:'self-improvement-promotion-eval.v1',
    promotable,
    decision:promotable?'PROMOTE':hardReject?'REJECT':'GATHER_MORE_EVIDENCE',
    gates:freeze(gates),
    failingGates:freeze(failing),
    evidenceCount:evidence,
    minEvidence,
    comparisons:freeze({
      qualityDelta,
      businessDelta,
      costRegression,
      latencyRegression
    }),
    unknownComparisons:freeze(unknownComparisons),
    rule:'promotion requires complete evidence, all required gates green, no quality regression and measurable improvement'
  });
}

function capabilityFit(model={},task={}){
  const required=new Set(arr(task.requiredCapabilities||task.required_capabilities).map(text).filter(Boolean));
  if(required.size===0)return 1;
  const offered=new Set(arr(model.capabilities).map(text).filter(Boolean));
  let hit=0;for(const cap of required)if(offered.has(cap))hit++;
  return hit/required.size;
}

export function routeModel({task={},models=[]}={}){
  const privacy=task.privacyClass||task.privacy_class||'standard';
  const maxCost=num(task.maxCostPer1k??task.max_cost_per_1k);
  const maxLatency=num(task.maxLatencyMs??task.max_latency_ms);
  const candidates=arr(models).map(model=>{
    const fit=capabilityFit(model,task);
    const quality=clamp(model.quality??0);
    const reliability=clamp(model.reliability??0);
    const privacyFit=arr(model.allowedPrivacyClasses||model.allowed_privacy_classes).includes(privacy)?1:0;
    const cost=num(model.costPer1k??model.cost_per_1k);
    const latency=num(model.latencyMs??model.latency_ms);
    const costFit=maxCost==null||cost==null?0.5:cost<=maxCost?1:Math.max(0,maxCost/cost);
    const latencyFit=maxLatency==null||latency==null?0.5:latency<=maxLatency?1:Math.max(0,maxLatency/latency);
    const eligible=privacyFit===1&&fit===1;
    const score=eligible?(
      0.38*quality+
      0.24*reliability+
      0.14*costFit+
      0.14*latencyFit+
      0.10*fit
    ):0;
    return freeze({
      modelId:model.modelId||model.model_id||model.id,
      provider:model.provider||null,
      eligible,
      score:Number(score.toFixed(4)),
      quality,reliability,costFit:Number(costFit.toFixed(4)),latencyFit:Number(latencyFit.toFixed(4)),privacyFit,capabilityFit:fit
    });
  }).sort((a,b)=>b.score-a.score||text(a.modelId).localeCompare(text(b.modelId)));
  const winner=candidates.find(x=>x.eligible)||null;
  return freeze({
    schemaVersion:'model-router.v1',
    winner,
    candidates:freeze(candidates),
    policy:'provider-neutral; choose highest evidence-backed utility within privacy, capability, cost and latency constraints'
  });
}

export function evaluateAgentObjective({objective,observations=[]}={}){
  if(!objective?.agentId)throw new TypeError('objective.agentId required');
  const metric=objective.primaryMetric;
  const xs=arr(observations).filter(x=>x&&x.metric===metric&&x.verified===true&&num(x.value)!=null);
  const ordered=[...xs].sort((a,b)=>Date.parse(a.observedAt||0)-Date.parse(b.observedAt||0));
  const first=ordered[0],last=ordered.at(-1);
  const delta=!first||!last?null:Number(last.value)-Number(first.value);
  const improving=delta==null?false:objective.direction==='min'?delta<0:delta>0;
  return freeze({
    schemaVersion:'agent-objective-evaluation.v1',
    agentId:objective.agentId,
    metric,
    verifiedObservations:xs.length,
    firstValue:first?Number(first.value):null,
    latestValue:last?Number(last.value):null,
    delta,
    improving,
    status:xs.length<2?'INSUFFICIENT_EVIDENCE':improving?'IMPROVING':'NOT_IMPROVING'
  });
}

export function assessArchitecture({
  modules=[],
  dependencies=[],
  duplicateGroups=[],
  securityFindings=[],
  performanceRegressions=[],
  schemaDrift=[]
}={}){
  const modCount=arr(modules).length;
  const depCount=arr(dependencies).length;
  const averageCoupling=modCount?depCount/modCount:0;
  const cycles=arr(dependencies).filter(x=>x?.cyclic===true).length;
  const duplicates=arr(duplicateGroups).filter(x=>Number(x.count||0)>1).length;
  const criticalSecurity=arr(securityFindings).filter(x=>['high','critical'].includes(text(x.severity).toLowerCase())).length;
  const perf=arr(performanceRegressions).length;
  const drift=arr(schemaDrift).length;
  const penalties=Math.min(1,
    cycles*0.08+
    duplicates*0.03+
    criticalSecurity*0.20+
    perf*0.06+
    drift*0.08+
    Math.max(0,averageCoupling-4)*0.025
  );
  const score=Number((1-penalties).toFixed(4));
  const blockers=[];
  if(cycles)blockers.push('dependency_cycles');
  if(criticalSecurity)blockers.push('critical_security_findings');
  if(drift)blockers.push('schema_drift');
  return freeze({
    schemaVersion:'architecture-guardian.v1',
    score,
    metrics:freeze({moduleCount:modCount,dependencyCount:depCount,averageCoupling:Number(averageCoupling.toFixed(3)),cycles,duplicateGroups:duplicates,criticalSecurity,performanceRegressions:perf,schemaDrift:drift}),
    blockers:freeze(blockers),
    promotionAllowed:blockers.length===0,
    rule:'architecture health may generate bounded change candidates but never directly rewrite production'
  });
}

export function compileLearning({source={},evaluation={},target='shared-policy'}={}){
  const verified=source.verified===true||evidenceCount(source)>0;
  const regressionProven=source.regressionProven===true||source.regression_proven===true;
  const material=source.material!==false;
  const promotion=evaluation?.promotable===true;
  const outputs=[];
  if(verified&&material){
    outputs.push({kind:'regression_requirement',required:true,sourceFingerprint:source.fingerprint||source.id||null});
    outputs.push({kind:'skill_projection',required:true,target});
    outputs.push({kind:'documentation_writeback',required:true});
    outputs.push({kind:'system_map_writeback',required:source.topologyChanged===true||source.topology_changed===true});
    outputs.push({kind:'optimization_candidate',required:true,directProductionMutation:false});
  }
  if(promotion&&regressionProven)outputs.push({kind:'promotion_recommendation',required:true,authority:'existing-protected-delivery'});
  return freeze({
    schemaVersion:'learning-compiler.v1',
    compilable:verified&&material,
    sourceVerified:verified,
    regressionProven,
    outputs:freeze(outputs),
    hardBoundary:'learning creates versioned candidates and controls; it never bypasses protected delivery'
  });
}

export function buildDailyImprovementScore({
  companyLearning=0,
  agentLearning=0,
  engineeringLearning=0,
  architectureHealth=0,
  businessOutcome=0,
  reliability=0,
  evidenceCompleteness=0
}={}){
  const components={
    companyLearning:clamp(companyLearning),
    agentLearning:clamp(agentLearning),
    engineeringLearning:clamp(engineeringLearning),
    architectureHealth:clamp(architectureHealth),
    businessOutcome:clamp(businessOutcome),
    reliability:clamp(reliability),
    evidenceCompleteness:clamp(evidenceCompleteness)
  };
  const score=Number((
    components.companyLearning*0.15+
    components.agentLearning*0.15+
    components.engineeringLearning*0.15+
    components.architectureHealth*0.15+
    components.businessOutcome*0.20+
    components.reliability*0.12+
    components.evidenceCompleteness*0.08
  ).toFixed(4));
  const guardrailGreen=components.reliability>=0.85&&components.architectureHealth>=0.8&&components.evidenceCompleteness>=0.8;
  return freeze({
    schemaVersion:'daily-improvement-score.v1',
    score,
    components:freeze(components),
    guardrailGreen,
    status:guardrailGreen?(score>=0.75?'COMPOUNDING':'LEARNING'):'GUARDRAIL_ATTENTION',
    northStar:SELF_IMPROVEMENT_CONTRACT.northStar
  });
}
