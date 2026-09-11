const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const arr=value=>Array.isArray(value)?value.filter(v=>v!=null):[];
const txt=value=>value==null?'':String(value);

export function normalizeEvidence(input={}){
  const sourceRef=txt(input.source_ref);
  return {
    evidence_id:txt(input.evidence_id),
    tenant_id:txt(input.tenant_id),
    subject_id:txt(input.subject_id),
    source_type:txt(input.source_type),
    source_ref:sourceRef,
    observed_at:txt(input.observed_at),
    source_date:txt(input.source_date),
    valid_until:txt(input.valid_until),
    freshness:clamp01(input.freshness),
    confidence:clamp01(input.confidence),
    quality:clamp01(input.quality),
    scope:input.scope??null,
    graph_links:arr(input.graph_links),
    value:input.value??null,
    unit:txt(input.unit),
    verified:input.verified===true,
    provenance_chain:arr(input.provenance_chain).length?arr(input.provenance_chain):sourceRef?[sourceRef]:[]
  };
}

export function normalizeCandidate(input={}){
  return {
    ...input,
    candidate_id:txt(input.candidate_id),
    tenant_id:txt(input.tenant_id),
    finding_ids:arr(input.finding_ids),
    type:txt(input.type),
    title:txt(input.title),
    action:txt(input.action),
    owner:input.owner??null,
    dependencies:arr(input.dependencies).map(String),
    expected_value:num(input.expected_value),
    success_probability:clamp01(input.success_probability??input.confidence),
    confidence:clamp01(input.confidence),
    evidence_quality:clamp01(input.evidence_quality),
    evidence_freshness:input.evidence_freshness==null?1:clamp01(input.evidence_freshness),
    urgency:clamp01(input.urgency),
    strategic_fit:clamp01(input.strategic_fit),
    learning_value:clamp01(input.learning_value),
    reusability:clamp01(input.reusability),
    cost:Math.max(0,num(input.cost)),
    opportunity_cost:Math.max(0,num(input.opportunity_cost)),
    risk:clamp01(input.risk),
    time:Math.max(0,num(input.time)),
    capacity:Math.max(0,num(input.capacity)),
    payback_months:input.payback_months==null?null:Math.max(0,num(input.payback_months)),
    do_nothing_cost:Math.max(0,num(input.do_nothing_cost)),
    hard_boundary:input.hard_boundary===true,
    budget_ok:input.budget_ok!==false,
    contact_pressure_ok:input.contact_pressure_ok!==false,
    production_red:input.production_red===true,
    data_integrity_red:input.data_integrity_red===true,
    provenance:arr(input.provenance),
    approval_state:txt(input.approval_state||'NOT_REQUIRED'),
    created_by:txt(input.created_by)
  };
}

export {clamp01};
