/**
 * One canonical *assignment projection* for original Powerhouse agents.
 * Assignment != natural execution, deployed code, customer task or paid order.
 * No scheduler, external action, storage, new team or authority is created.
 */
export const ALL_AGENT_INNOVATION_DUTY_CONTRACT='POWERHOUSE_ALL_AGENT_INNOVATION_DUTY_V1';


// KPI definitions are part of the existing assignment projection, not a metrics store.
// Never infer numerical results from assignment coverage. The original Heartbeat
// consumer owns observations, denominators, window and source proof.
const specialistKpis=[["agent-integration-engineer","verified_production_innovations","count","protected release + original operation production readback","higher"],["agent-integration-engineer","verified_outcome_rate","percent","independent Heartbeat measured outcomes / matured original innovation obligations","higher"],["agent-code-quality","escaped_defect_rate","percent","original quality events escaped to production / reviewed releases","lower"],["agent-reliability","recovery_duration_p95","minutes","original failure registry detection-to-verified-recovery timestamps","lower"],["agent-security","open_critical_findings","count","original current independently verified security findings","lower"],["agent-cost","cost_per_verified_outcome","EUR/outcome","original realized cost / verified outcome count","lower"],["agent-performance","p95_latency","ms","original representative runtime latency telemetry","lower"],["agent-data-quality","source_completeness","percent","original required source fields verified / required fields","higher"],["agent-website-ux","task_success_rate","percent","original representative consented task successes / eligible tasks","higher"],["agent-seo-content","qualified_organic_leads","count","original attributed consent-eligible qualified organic leads","higher"],["agent-growth-market","paid_orders","count","original independently verified paid orders with attribution","higher"],["agent-integration-composio","verified_transfer_rate","percent","original provider-readback verified transfers / eligible due transfers","higher"],["agent-social-delivery-recovery","verified_publication_rate","percent","original due publication obligations with independent provider proof / eligible due obligations","higher"],["agent-governance-ai-act","verified_control_coverage","percent","original applicable controls independently evidenced / applicable controls","higher"],["agent-product-opportunity","verified_value_opportunities","count","original opportunities with independently measured realized customer value","higher"]];
const sharedKpis=[
 ['independent_outcome_rate','percent','original matured duties with independent effect proof / eligible matured duties','higher'],
 ['on_time_delivery_rate','percent','original due duties independently verified by deadline / eligible due duties','higher'],
 ['applied_learning_rate','percent','original due learning obligations with next-natural-run proof / eligible due learning obligations','higher']
];
export function originalAgentKpiContract(agentId){
  const rows=[...sharedKpis,...specialistKpis.filter(r=>r[0]===agentId).map(r=>r.slice(1))];
  return {version:'original-agent-kpi-20261124-v1',owner:agentId,source:'existing ONE BRAIN and Heartbeat',
    windows:['7d_closed','28d_closed'],measurementStatus:'SOURCE_READBACK_DUE',
    metrics:rows.map(([id,unit,definition,direction])=>({id,unit,definition,direction,
      actual:null,baseline:null,target:null,denominator:null,observedAt:null,sourceRef:null,
      status:'UNKNOWN',targetPolicy:'original owner sets evidence-based target after comparable baseline'})),
    assignmentIsNotMeasurement:true,independentProofRequired:true};
}

const domainMatches={
  'consented-conversion-recovery':['Website','UX','SEO','Growth','Commercial','Data','Data Quality','Integration','Automation'],
  'next-natural-agent-learning':['Product','Operations','Data','Growth','Commercial','Reliability','Quality'],
  'customer-action-copilot':['Product','Strategy','Opportunity','Market','Data','Website','UX'],
  'adaptive-portal-ux':['Website','UX','Product','Performance','Data','Data Quality'],
  'autonomous-agent-quality-ratchet':['Reliability','Operations','Security','Trust','Governance','AI Act','Cost','Performance','Data Quality'],
  'evidence-backed-buyer-problem-discovery':['Growth','Market','Commercial','Strategy','Opportunity','Content','SEO']
};
const validId=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9._-]{2,100}$/.test(x);
const safeDate=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&Date.parse(x)>0;
const invalid=(reason,observedAt=null)=>({
  contract:ALL_AGENT_INNOVATION_DUTY_CONTRACT,status:'UNVERIFIED',
  reason,observedAt,agentCount:null,assignedCount:0,uncoveredAgentIds:[],
  assignments:[],appliedToNaturalRunVerified:false,customerOrRevenueUpliftVerified:false
});
export function buildAllAgentInnovationDuties({agents=[],innovationPortfolio=null,at=new Date().toISOString()}={}){
  if(!safeDate(at)||!Array.isArray(agents)||!Array.isArray(innovationPortfolio?.innovationCandidates))
    return invalid('ROSTER_PORTFOLIO_OR_TIME_UNAVAILABLE');
  const when=new Date(Date.parse(at)).toISOString();
  const seen=new Set();
  const candidates=innovationPortfolio.innovationCandidates;
  if(!candidates.length)return invalid('NO_EXISTING_INNOVATION_CANDIDATES',when);
  const candidateIds=new Set();
  for(const candidate of candidates){
    if(!validId(candidate?.id)||candidateIds.has(candidate.id)||
      !validId(candidate?.fingerprint?.split('|')[2])||
      !['MEASUREMENT_OR_SOURCE_REPAIR','BOUNDED_OWNER_BUILD_CANDIDATE','HYPOTHESIS_EVALUATION_DUE'].includes(candidate?.stage)||
      candidate.automaticPromotionAuthorized!==false)
      return invalid('INNOVATION_SOURCE_IDENTITY_OR_RELEASE_GUARD_UNVERIFIED',when);
    candidateIds.add(candidate.id);
  }
  const assignments=[];
  for(const agent of agents){
    if(!validId(agent?.id)||seen.has(agent.id)||!Array.isArray(agent.domains)||!agent.domains.length||
       !Array.isArray(agent.capabilities)||!agent.capabilities.length)
      return invalid('AGENT_ROSTER_DUPLICATE_OR_MISSING_CAPABILITIES',when);
    seen.add(agent.id);
    const domains=new Set(agent.domains.filter(d=>typeof d==='string'));
    const scored=candidates.map(candidate=>{
      const eligible=domainMatches[candidate.id]||[];
      const overlap=eligible.filter(domain=>domains.has(domain)).length+
        (candidate.id==='adaptive-portal-ux'&&domains.has('UX')?2:0);
      const canAct=agent.capabilities.some(x=>['create','optimize','experiment','recover','design','integrate','research','harden','audit','verify','govern','diagnose','analyze','measure','validate','reconcile','prioritize'].includes(x));
      return {candidate,overlap,canAct};
    }).filter(x=>x.overlap>0&&x.canAct).sort((a,b)=>
      b.overlap-a.overlap||Number(b.candidate.attentionRank||0)-Number(a.candidate.attentionRank||0)||
      a.candidate.id.localeCompare(b.candidate.id));
    // Every active/future registered specialist has at least a security/reliability
    // contribution. Do not infer domain authorization to mutate other components.
    const selection=scored[0]?.candidate??candidates.find(x=>x.id==='autonomous-agent-quality-ratchet');
    if(!selection)return invalid('NO_SAFE_ORIGINAL_AGENT_DUTY',when);
    const overlap=scored[0]?.overlap??0;
    assignments.push({
      agentId:agent.id,
      kpiContract:originalAgentKpiContract(agent.id),
      originalDomains:[...domains].sort(),
      innovationId:selection.id,
      innovationFingerprint:selection.fingerprint,
      originalOwner:selection.owner,
      responsibility:overlap>0?'PROPOSE_BUILD_OR_VERIFY_WITHIN_ORIGINAL_ROLE':'CROSS_DOMAIN_QUALITY_AND_SECURITY_REVIEW_ONLY',
      evidenceState:selection.stage,
      executionState:'ASSIGNED_NOT_EXECUTED',
      canAutonomouslyImplement:Boolean(overlap>0&&agent.capabilities.some(x=>
        ['create','optimize','experiment','recover','design','integrate','harden'].includes(x))),
      sourceProofRequired:true,
      existingExclusiveWriterRequired:true,
      protectedReleaseRequired:true,
      nextNaturalRunProofRequired:true,
      independentCustomerValueOrPaidOrderProofRequired:true,
      noNewScheduler:true,
      originalCodePath:selection.existingAuthority,
      nextAction:selection.implementationBrief,
      actualApplicationId:null,
      exactProductionSha:null,
      verifiedOutcome:null
    });
  }
  const sorted=assignments.sort((a,b)=>a.agentId.localeCompare(b.agentId));
  return {
    contract:ALL_AGENT_INNOVATION_DUTY_CONTRACT,
    status:'ROSTER_COVERED_APPLICATION_EVIDENCE_DUE',
    reason:'Assignments cover current source-controlled agent roster, not actual natural execution or skill consumption.',
    observedAt:when,
    agentCount:agents.length,
    assignedCount:sorted.length,
    kpiDefinitionCoverage:sorted.filter(x=>x.kpiContract.metrics.length>=3).length,
    kpiMeasuredCoverage:0,
    kpiMeasurementStatus:'INDEPENDENT_HEARTBEAT_READBACK_DUE',
    uncoveredAgentIds:[],
    assignments:sorted,
    appliedToNaturalRunVerified:false,
    customerOrRevenueUpliftVerified:false,
    newSchedulers:0,
    newWriters:0,
    source:'original platform/agents/agent-team.mjs and ONE BRAIN innovation read-only portfolio'
  };
}
