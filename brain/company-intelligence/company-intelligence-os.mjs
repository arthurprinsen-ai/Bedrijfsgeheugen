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

export function buildOutcomeMemory({salesOutcomes=[],realizedValues=[],decisionCycles=[]}={}){
  const cycleById=new Map(arr(decisionCycles).map(x=>[txt(x.cycle_id||x.cycleId),x]));
  const items=[];
  for(const o of arr(salesOutcomes)){
    items.push(freeze({
      memoryKey:'sales_outcome:'+txt(o.outcome_id||o.dedupe_key),
      kind:'sales_outcome',subjectKey:o.subject_key||null,personKey:o.person_key||null,
      companyKey:norm(o.company_key),outcomeType:o.outcome_type||null,
      realizedValue:Number(o.revenue_eur||0),unit:'EUR',observedAt:o.occurred_at||o.created_at||null,
      canonicalRef:'powerhouse_sales_outcomes:'+txt(o.outcome_id||o.dedupe_key),
      evidence:freeze({...o.evidence}),verified:Boolean(o.evidence&&Object.keys(o.evidence).length)
    }));
  }
  for(const r of arr(realizedValues)){
    const cycle=cycleById.get(txt(r.cycle_id))||{};
    items.push(freeze({
      memoryKey:'realized_value:'+txt(r.observation_id),
      kind:'realized_value',subjectKey:cycle.subject_key||null,personKey:null,companyKey:'',
      outcomeType:r.value_type||null,realizedValue:Number(r.numeric_value||0),
      unit:r.currency||r.unit||null,observedAt:r.observed_at||null,
      canonicalRef:'powerhouse_realized_values:'+txt(r.observation_id),
      evidence:freeze({evidenceRef:r.evidence_ref||null,provenance:r.provenance||{}}),
      verified:Boolean(r.evidence_ref)
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

export function buildCompoundIntelligence({context={},outcomeMemory={},actions=[],opportunities=[]}={}){
  const outcomes=arr(outcomeMemory.items);
  const verified=outcomes.filter(x=>x.verified);
  const pending=arr(actions).filter(a=>!['done','skipped','expired','error'].includes(txt(a.status).toLowerCase()));
  const open=arr(opportunities).filter(o=>!['won','lost','deferred'].includes(txt(o.status).toLowerCase()));
  const learningDensity=verified.length?Math.min(1,verified.length/Math.max(3,open.length+1)):0;
  const state=pending.length?'act_and_observe':verified.length?'learn_and_reprioritize':open.length?'decide_next_action':'enrich_context';
  return freeze({
    schemaVersion:'compound-intelligence.v1',
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
