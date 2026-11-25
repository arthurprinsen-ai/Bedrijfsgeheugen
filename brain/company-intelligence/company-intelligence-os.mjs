const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const arr=v=>Array.isArray(v)?v:[];
const txt=v=>String(v??'').trim();
const norm=v=>txt(v).toLowerCase().replace(/\s+/g,' ');
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));

export const COMPANY_INTELLIGENCE_OS_CONTRACT=freeze({
  version:'company-intelligence-os.v1',
  category:'AI-native company operating system / company intelligence platform',
  loop:['know','understand','decide','act','observe','learn','compound'],
  layers:['company_graph','system_of_context','autonomous_action_layer','outcome_memory','compound_intelligence'],
  invariants:[
    'crm_is_a_source_not_the_brain',
    'no_parallel_source_of_truth',
    'every_material_fact_keeps_evidence_lineage',
    'every_action_has_an_execution_boundary',
    'outcomes_are_observed_not_invented',
    'learning_must_change_a_future_decision',
    'sensitive_inference_is_forbidden'
  ]
});

const node=(type,key,label,attrs={},confidence=0.5,observedAt=null,canonicalRef=null)=>freeze({
  nodeKey:`${type}:${key}`,nodeType:type,key,label:label||key,
  canonicalRef:canonicalRef||`${type}:${key}`,confidence:clamp(confidence),
  observedAt:observedAt||null,attributes:freeze({...attrs})
});
const edge=(from,relation,to,canonicalRef,confidence=0.5,observedAt=null,evidence={})=>freeze({
  edgeKey:`${from}|${relation}|${to}|${canonicalRef||''}`,
  fromNodeKey:from,relation,toNodeKey:to,canonicalRef:canonicalRef||null,
  confidence:clamp(confidence),observedAt:observedAt||null,evidence:freeze({...evidence})
});

export function buildCompanyGraph({connections=[],opportunities=[],actions=[]}={}){
  const nodes=new Map(),edges=new Map();
  for(const c of arr(connections)){
    const personKey=txt(c.person_key||c.personKey||c.sleutel||c.linkedin_url);
    if(!personKey)continue;
    const companyLabel=txt(c.bedrijf||c.company_name||c.companyName);
    const companyKey=norm(c.company_key||c.companyKey||companyLabel);
    const confidence=clamp(c.data_completeness??c.confidence??0.5);
    const observed=c.enriched_at||c.observed_at||c.bijgewerkt_op||null;
    const pn=node('person',personKey,txt(c.naam||c.person_name)||personKey,{role:c.rol||c.role||null,status:c.status||null,linkedinUrl:c.linkedin_url||null},confidence,observed,'powerhouse_connection_enrichment_v1:'+personKey);
    nodes.set(pn.nodeKey,pn);
    if(companyKey){
      const cn=node('company',companyKey,companyLabel||companyKey,{},confidence,observed,'company-derived:'+companyKey);
      if(!nodes.has(cn.nodeKey))nodes.set(cn.nodeKey,cn);
      const e=edge(pn.nodeKey,'works_at_or_related_to',cn.nodeKey,'connection:'+personKey,confidence,observed,{source:'canonical_connection'});
      edges.set(e.edgeKey,e);
    }
  }
  for(const o of arr(opportunities)){
    const key=txt(o.opportunity_key||o.opportunityKey||o.opportunity_id);
    if(!key)continue;
    const on=node('opportunity',key,key,{stage:o.stage||null,status:o.status||null,expectedValueEur:Number(o.expected_value_eur||0),expectedRevenueValue:Number(o.expected_revenue_value||0)},o.confidence??0.5,o.last_evidence_at||o.updated_at||null,'powerhouse_opportunities:'+key);
    nodes.set(on.nodeKey,on);
    const pk=txt(o.person_key||o.personKey),ck=norm(o.company_key||o.companyKey);
    if(pk){const e=edge(on.nodeKey,'targets_person','person:'+pk,'opportunity:'+key,o.confidence??0.5,o.last_evidence_at||null,o.evidence||{});edges.set(e.edgeKey,e);}
    if(ck){const e=edge(on.nodeKey,'targets_company','company:'+ck,'opportunity:'+key,o.confidence??0.5,o.last_evidence_at||null,o.evidence||{});edges.set(e.edgeKey,e);}
  }
  for(const a of arr(actions)){
    const key=txt(a.action_id||a.actionId||a.dedupe_key);
    if(!key)continue;
    const an=node('action',key,a.action_type||'action',{channel:a.channel||null,status:a.status||null,priority:Number(a.priority||0)},0.8,a.executed_at||a.updated_at||a.created_at||null,'powerhouse_sales_actions:'+key);
    nodes.set(an.nodeKey,an);
    const refs=[['person',txt(a.person_key)],['company',norm(a.company_key)],['opportunity',txt(a.opportunity_key)]];
    for(const [type,ref] of refs){if(!ref)continue;const e=edge(an.nodeKey,'acts_on',type+':'+ref,'action:'+key,0.8,an.observedAt,a.evidence||{});edges.set(e.edgeKey,e);}
  }
  return freeze({schemaVersion:'company-graph.v1',nodes:freeze([...nodes.values()]),edges:freeze([...edges.values()])});
}

export function compileSystemOfContext({companyKey,companyName,graph={},evidence=[],now=()=>new Date().toISOString()}={}){
  const ck=norm(companyKey||companyName);
  const relatedNodes=arr(graph.nodes).filter(n=>n.nodeKey===`company:${ck}`||norm(n.attributes?.companyKey)===ck);
  const relatedEdges=arr(graph.edges).filter(e=>e.fromNodeKey===`company:${ck}`||e.toNodeKey===`company:${ck}`);
  const ev=arr(evidence).filter(x=>norm(x.company_key||x.companyKey||x.entity_key)===ck);
  const confidences=[...relatedNodes.map(x=>x.confidence),...relatedEdges.map(x=>x.confidence),...ev.map(x=>x.confidence)].filter(Number.isFinite);
  return freeze({
    schemaVersion:'system-of-context.v1',
    companyKey:ck,companyName:companyName||relatedNodes.find(x=>x.nodeType==='company')?.label||ck,
    compiledAt:now(),graph:{nodeCount:relatedNodes.length,edgeCount:relatedEdges.length},
    evidenceCount:ev.length,
    contextConfidence:confidences.length?Number((confidences.reduce((a,b)=>a+b,0)/confidences.length).toFixed(3)):0,
    evidenceRefs:freeze(ev.map(x=>x.source_ref||x.evidence_ref||x.id).filter(Boolean)),
    truthBoundary:'derived context; canonical source rows remain authoritative'
  });
}

const observedAmount=value=>{
  if(value===null||value===undefined||value==='')return null;
  const numeric=Number(value);
  return Number.isFinite(numeric)?numeric:null;
};

// The original SQL Outcome Memory joins the immutable runtime event by exact
// source event ID. Pure JS callers must supply that readback explicitly;
// metadata-only evidence is never an independent observation.
const independentlyObservedSalesOutcome=o=>{
  const e=o?.evidence||{},read=o?.source_event_readback||o?.sourceEventReadback||{};
  const nonEmpty=x=>txt(x).length>0;
  const observedAt=Date.parse(txt(o?.occurred_at||o?.created_at));
  const originAt=Date.parse(txt(read.occurred_at));
  return !['sent','not_executed','execution_completed'].includes(txt(o?.outcome_type))
    && e.synthetic_business_result!==true
    && e.source_data_quality==='VERIFIED'
    && nonEmpty(e.source_event_id)&&nonEmpty(e.source_event_type)
    && nonEmpty(e.source_dedupe_key)
    && read.independently_verified===true&&read.data_quality==='VERIFIED'
    && txt(read.event_id)===txt(e.source_event_id)
    && txt(read.event_type)===txt(e.source_event_type)
    && txt(read.dedupe_key)===txt(e.source_dedupe_key)
    && norm(read.company_key)===norm(o.company_key)
    && txt(read.person_key)===txt(o.person_key)
    && Number.isFinite(observedAt)&&Number.isFinite(originAt)&&originAt<=observedAt
    && read.evidence&&typeof read.evidence==='object'
    && Object.keys(read.evidence).length>0;
};

export function buildOutcomeMemory({salesOutcomes=[],realizedValues=[],decisionCycles=[]}={}){
  const cycleById=new Map(arr(decisionCycles).map(x=>[txt(x.cycle_id||x.cycleId),x]));
  const items=[];
  for(const o of arr(salesOutcomes)){
    const evidence=o?.evidence&&typeof o.evidence==='object'?o.evidence:{};
    items.push(freeze({
      memoryKey:'sales_outcome:'+txt(o.outcome_id||o.dedupe_key),
      kind:'sales_outcome',subjectKey:o.subject_key||null,personKey:o.person_key||null,
      companyKey:norm(o.company_key),outcomeType:o.outcome_type||null,
      realizedValue:observedAmount(o.revenue_eur),unit:'EUR',
      observedAt:o.occurred_at||o.created_at||null,
      canonicalRef:'powerhouse_sales_outcomes:'+txt(o.outcome_id||o.dedupe_key),
      evidence:freeze({...evidence}),
      verified:independentlyObservedSalesOutcome(o)
    }));
  }
  for(const r of arr(realizedValues)){
    const cycle=cycleById.get(txt(r.cycle_id))||{};
    const provenance=r?.provenance&&typeof r.provenance==='object'?r.provenance:{};
    const verified=Boolean(
      txt(r.evidence_ref)&&observedAmount(r.numeric_value)!==null
      &&provenance.independent_readback_verified===true
      &&txt(provenance.source_revision)&&txt(provenance.baseline_id)
      &&txt(provenance.period_id)
    );
    items.push(freeze({
      memoryKey:'realized_value:'+txt(r.observation_id),
      kind:'realized_value',subjectKey:cycle.subject_key||null,personKey:null,companyKey:'',
      outcomeType:r.value_type||null,realizedValue:observedAmount(r.numeric_value),
      unit:r.currency||r.unit||null,observedAt:r.observed_at||null,
      canonicalRef:'powerhouse_realized_values:'+txt(r.observation_id),
      evidence:freeze({evidenceRef:r.evidence_ref||null,provenance:{...provenance}}),
      verified
    }));
  }
  return freeze({schemaVersion:'outcome-memory.v1',items:freeze(items),verifiedCount:items.filter(x=>x.verified).length});
}
export function classifyExecutionBoundary(action={}){
  const status=txt(action.status).toLowerCase();
  const gate=action?.evidence?.execution_gate||{};
  if(['done','skipped','expired','error'].includes(status))return 'terminal';
  if(gate.human_authorization_required===true||gate.unsolicited_outreach_requires_human_authorization===true)return 'human_gate';
  if(['research_enrichment','internal_analysis','context_refresh'].includes(txt(action.action_type)))return 'autonomous_internal';
  if(status==='prepared')return 'runtime_governed';
  return 'policy_review';
}

export function buildCompoundIntelligence({context={},outcomeMemory={},actions=[],opportunities=[],optimization=null}={}){
  const outcomes=arr(outcomeMemory.items);
  const verified=outcomes.filter(x=>x.verified);
  const pending=arr(actions).filter(a=>!['done','skipped','expired','error'].includes(txt(a.status).toLowerCase()));
  const open=arr(opportunities).filter(o=>!['won','lost','deferred'].includes(txt(o.status).toLowerCase()));
  const learningDensity=verified.length?Math.min(1,verified.length/Math.max(3,open.length+1)):0;
  const state=pending.length?'act_and_observe':verified.length?'learn_and_reprioritize':open.length?'decide_next_action':'enrich_context';
  return freeze({
    schemaVersion:'compound-intelligence.v1',
    optimizationDecision:optimization===null?null:decideCompanyOptimization(optimization),
    companyKey:context.companyKey||null,
    loopState:state,
    verifiedOutcomes:verified.length,pendingActions:pending.length,openOpportunities:open.length,
    learningDensity:Number(learningDensity.toFixed(3)),
    nextDecisionBasis:freeze({
      contextConfidence:context.contextConfidence??0,
      outcomeEvidence:verified.length,
      actionEvidence:arr(actions).length,
      opportunityEvidence:arr(opportunities).length
    }),
    rule:'each observed outcome must improve prioritization, policy, prediction or next-best-action'
  });
}


// Canonical decision SUPPORT for the existing Powerhouse action fabric.
// This pure function never dispatches, changes source truth, or closes ONE BRAIN.
// All scenarios are source-proven; a missing cost is not a cost of zero.
export function decideCompanyOptimization({
  tenantId, candidates=[], observation={}, authorization={}, execution={}, effect={}, learning={}
}={}){
  const tenant=txt(tenantId);
  const result=(status,reason,candidate=null,extra={})=>freeze({
    status,reason,tenantId:tenant||null,
    candidateId:candidate?txt(candidate.candidate_id):null,
    originalOwner:candidate?txt(candidate.owner_agent):null,
    ...extra,
    authority:'original Powerhouse executor and ONE BRAIN only',
    dispatched:false,closed:false
  });
  if(!tenant)return result('SOURCE_EVIDENCE_DUE','TENANT_ID_REQUIRED');
  if(txt(observation.tenant_id)!==tenant || observation.source_health!=='healthy'
    ||!txt(observation.source_revision)||!txt(observation.correlation_id))
    return result('SOURCE_EVIDENCE_DUE','TENANT_SOURCE_REVISION_OR_CORRELATION_DUE');

  const hasRefs=x=>Array.isArray(x?.source_refs)&&x.source_refs.some(v=>txt(v));
  const amount=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e12;
  const scoped=arr(candidates).filter(c=>txt(c?.tenant_id)===tenant
    &&txt(c?.candidate_id)&&txt(c?.status).toLowerCase()==='candidate');
  if(!scoped.length)return result('CANDIDATE_OR_MEASUREMENT_DUE','NO_TENANT_SCOPED_CANDIDATE');
  if(new Set(scoped.map(c=>txt(c.candidate_id))).size!==scoped.length)
    return result('SOURCE_EVIDENCE_DUE','DUPLICATE_CANONICAL_CANDIDATE_CONFLICT');

  const valid=scoped.flatMap(c=>{
    const f=c?.expected_impact?.financial_forecast,b=c?.baseline||{},sc=arr(f?.scenarios);
    if(txt(c.safety_class)!=='safe_reversible'||!txt(c.owner_agent)
      ||!txt(c.proposed_action?.action)||!txt(c.rollback_plan?.action)
      ||!txt(b.baseline_id)||!txt(b.period_id)||!hasRefs(b)
      ||f?.status!=='MODELLED_NOT_REALIZED'||f?.evidence_health?.status!=='healthy'
      ||txt(f.source_revision)!==txt(observation.source_revision)
      ||txt(f.baseline_id)!==txt(b.baseline_id)||txt(f.period_id)!==txt(b.period_id)
      ||txt(f.metric_id)!=='NET_SAVINGS_EUR'||txt(f.unit).toUpperCase()!=='EUR'
      ||!hasRefs(f)||sc.length!==4)return [];
    const values=new Map();
    for(const name of ['no_action','downside','base','upside']){
      const found=sc.filter(s=>txt(s?.case)===name);
      if(found.length!==1||!hasRefs(found[0])||!amount(found[0].net_value_eur))return [];
      values.set(name,found[0].net_value_eur);
    }
    // Only risk-bounded net-positive scenarios can be offered for autonomous
    // execution. Losing-downside proposals remain human/policy review.
    if(values.get('no_action')!==0||values.get('downside')<0
      ||values.get('base')<=0||values.get('upside')<values.get('base'))return [];
    return [{candidate:c,base:values.get('base')}];
  }).sort((a,b)=>b.base-a.base||txt(a.candidate.candidate_id).localeCompare(txt(b.candidate.candidate_id)));
  if(!valid.length)return result('MEASUREMENT_OR_POLICY_REVIEW_DUE',
    'NO_SOURCE_BACKED_SAFE_REVERSIBLE_NET_POSITIVE_SCENARIO');
  const selected=valid[0].candidate;
  const grant=authorization||{};
  const lease=grant.owner_lease||{};
  if(grant.tenant_id!==tenant||grant.candidate_id!==selected.candidate_id
    ||grant.policy_granted!==true||grant.reversible_allowed!==true
    ||txt(grant.correlation_id)!==txt(observation.correlation_id)
    ||!txt(grant.policy_revision)||!txt(grant.idempotency_key)
    ||lease.active!==true||txt(lease.owner)!==txt(selected.owner_agent))
    return result('ORIGINAL_POLICY_GATE_DUE','AUTHORIZATION_OR_SINGLE_OWNER_LEASE_DUE',selected);
  const ref={
    sourceRevision:txt(observation.source_revision),
    correlationId:txt(observation.correlation_id),
    idempotencyKey:txt(grant.idempotency_key),
    forecastBaseNetEur:valid[0].base
  };
  if(!execution||Object.keys(execution).length===0)
    return result('READY_FOR_ORIGINAL_EXECUTOR','GOVERNED_REVERSIBLE_ACTION_ELIGIBLE_NOT_EXECUTED',selected,ref);
  if(execution.independent_readback!==true || execution.status!=='INDEPENDENTLY_VERIFIED'
    ||txt(execution.tenant_id)!==tenant
    ||txt(execution.candidate_id)!==txt(selected.candidate_id)
    ||txt(execution.source_revision)!==txt(observation.source_revision)
    ||txt(execution.correlation_id)!==txt(observation.correlation_id)
    ||txt(execution.idempotency_key)!==txt(grant.idempotency_key)
    ||!txt(execution.provider_receipt_id)||!hasRefs(execution))
    return result('EXECUTION_PROOF_DUE','PROVIDER_OR_TENANT_READBACK_MISSING',selected,ref);
  if(!effect||effect.independently_verified!==true
    ||txt(effect.tenant_id)!==tenant||txt(effect.candidate_id)!==txt(selected.candidate_id)
    ||txt(effect.baseline_id)!==txt(selected.baseline.baseline_id)
    ||txt(effect.period_id)!==txt(selected.baseline.period_id)
    ||txt(effect.source_revision)!==txt(observation.source_revision)
    ||txt(effect.correlation_id)!==txt(observation.correlation_id)
    ||effect.comparator!=='NO_ACTION'||!txt(effect.method_version)
    ||!hasRefs(effect)||!amount(effect.gross_savings_eur)
    ||!amount(effect.implementation_cost_eur)||!amount(effect.operating_cost_eur)
    ||effect.gross_savings_eur<0||effect.implementation_cost_eur<0||effect.operating_cost_eur<0
    ||!amount(effect.net_savings_eur)
    ||Math.abs(effect.net_savings_eur-(effect.gross_savings_eur-
       effect.implementation_cost_eur-effect.operating_cost_eur))>0.01)
    return result('INDEPENDENT_MEASUREMENT_DUE','COST_BASELINE_COUNTERFACTUAL_OR_METRIC_DUE',selected,ref);
  if(learning?.independently_verified!==true
    ||txt(learning.candidate_id)!==txt(selected.candidate_id)
    ||txt(learning.tenant_id)!==tenant
    ||txt(learning.source_revision)!==txt(observation.source_revision)
    ||txt(learning.correlation_id)!==txt(observation.correlation_id)
    ||!txt(learning.next_decision_id)||!hasRefs(learning))
    return result('NEXT_DECISION_LEARNING_DUE','NO_VERIFIED_NEXT_DECISION_CHANGE',selected,ref);
  return result('ONE_BRAIN_CLOSURE_REVIEW_DUE','ALL_PROOFS_PRESENT_ORIGINAL_AUTHORITY_MUST_CLOSE',
    selected,{...ref,observedNetEur:effect.net_savings_eur});
}
