/**
 * One canonical *assignment projection* for original Powerhouse agents.
 * Assignment != natural execution, deployed code, customer task or paid order.
 * No scheduler, external action, storage, new team or authority is created.
 */
export const ALL_AGENT_INNOVATION_DUTY_CONTRACT='POWERHOUSE_ALL_AGENT_INNOVATION_DUTY_V1';

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
      const overlap=eligible.filter(domain=>domains.has(domain)).length;
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
    uncoveredAgentIds:[],
    assignments:sorted,
    appliedToNaturalRunVerified:false,
    customerOrRevenueUpliftVerified:false,
    newSchedulers:0,
    newWriters:0,
    source:'original platform/agents/agent-team.mjs and ONE BRAIN innovation read-only portfolio'
  };
}
