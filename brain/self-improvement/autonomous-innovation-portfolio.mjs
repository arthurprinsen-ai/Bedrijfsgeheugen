/**
 * Autonomous technology innovation shortlist for the EXISTING Powerhouse One Brain.
 * A plan is not a deployed change, customer outcome, validated model or authorization.
 * The original executing agents may deliver candidates only through protected releases.
 */
export const INNOVATION_CONTRACT='POWERHOUSE_AGENT_AUTONOMOUS_INNOVATION_V1';

const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
const count=n=>finite(n)!==null&&Number.isSafeInteger(n)?n:null;
const src=(proof,key)=>proof?.evidenceSources?.[key]??null;
const trusted=o=>o?.status==='READBACK_COMPLETE';
const evidence=(value,description)=>({value:value??null,source:description,verified:value!==null&&value!==undefined});
const meta=Object.freeze([
 {id:'consented-conversion-recovery',domain:'orders',
  owner:'original SEO Order Engine + CRO Experiment agent',
  problem:'Consent-based page activity is not linked to verified CTA, qualified lead and paid provider order.',
  tech:['First-party consented event_id reconciliation','deterministic attribution','controlled CTA experiment'],
  change:'Extend only original growth-event, event-drain and lead-to-payment source reconciliation; add first-party receipt readback and compare a real control cohort.',
  metric:'provider_verified_paid_orders_per_consent_eligible_visit',
  guards:['consent','bot-filter','privacy','provider-id','original-experiment-holdout','idempotency'],
  path:'original growth-event, CRO, payment proof and Portal V2, not an alternate CRM'},
 {id:'next-natural-agent-learning',domain:'intelligence',
  owner:'existing ONE BRAIN Self-Improvement + Growth/Revenue agents',
  problem:'Learning records exist but original next-action social/revenue learning applications are not independently verified.',
  tech:['idempotent learning application lineage','champion-challenger evaluation','provider-neutral model routing'],
  change:'At the next existing natural run, read a validated scoped lesson, record same source decision/application ID and compare a nonregressing challenger against original evaluator.',
  metric:'independently_verified_next_action_learning_effect',
  guards:['source-freshness','identity','model-eval','fallback','data-minimization','protected-release'],
  path:'existing social/revenue_learning_applications and brain self-improvement evaluator'},
 {id:'customer-action-copilot',domain:'customer_portal',
  owner:'existing Portal V2 + Company Intelligence + customer success agents',
  problem:'Portal navigation events cannot establish that a verified tenant customer understood and completed a valuable business action.',
  tech:['tenant-grounded knowledge graph retrieval','explainable source-to-action recommendations','consented task-completion instrument'],
  change:'Show customer-authorized source → business impact → explainable recommendation → explicit user action → measured task resolution; first use read-only demo/shadow with original customer rights.',
  metric:'verified_customer_task_completion_and_time_to_value',
  guards:['tenant-rls','consent','source-freshness','no-raw-client-data','relevance','human-control'],
  path:'existing portal tenant authorization, Company Graph, Source Universe and outcome register'},
 {id:'adaptive-portal-ux',domain:'customer_portal',
  owner:'existing Portal V2 CRO Experiment and Customer Success',
  problem:'Authenticated customer activation, task abandonment, retention and measured value lack an independent cohort baseline.',
  tech:['privacy-preserving task funnel','accessibility/performance instrumentation','guarded champion-challenger UX tests'],
  change:'Measure original authenticated task start/completion, error and latency in a tenant-safe aggregate and evaluate smallest reversible onboarding/action UI change with holdout.',
  metric:'customer_activation_completion_and_retention',
  guards:['tenant-rls','accessibility','performance','privacy','holdout-minimum','rollback'],
  path:'existing portal CRO instrumentation, experiment policy and original customer feedback'},
 {id:'autonomous-agent-quality-ratchet',domain:'engineering',
  owner:'existing ONE BRAIN/Heartbeat + Engineering Self-Improvement agents',
  problem:'A technical fix or learning note does not prove the next agent used it or reduced incident recurrence.',
  tech:['fingerprinted error retrieval','replay-based skill eval','protected PR canaries','cost/latency-aware model routing'],
  change:'Require exact fingerprint → regression test → protected fix → exact deploy → next natural skill readback → recurrence and quality comparison; rollback failed challengers.',
  metric:'verified_repeat_incident_reduction_without_cost_or_quality_regression',
  guards:['security','CodeQL','Required','single-writer','exact-SHA','rollback','cost-cap'],
  path:'existing Brain error registry, engineering fabric and protected release'},
 {id:'evidence-backed-buyer-problem-discovery',domain:'orders',
  owner:'existing External Intelligence + Relationship/Revenue Growth Swarm',
  problem:'Commercial opportunities and forecasts exist without measured buyer feedback, independent attribution or payment outcomes.',
  tech:['fresh public-source retrieval','tenant-safe knowledge graph','explainable next-best-action'],
  change:'Score original company buying signals against verified source+freshness, build a specific opt-in value-first offer and compare actual consented buyer actions, not imagined pipeline.',
  metric:'verified_qualified_buyers_to_paid_orders',
  guards:['freshness','independent-sources','consent','contact-pressure','dedupe','actual-provider-receipt'],
  path:'original opportunities, relationship intelligence, growth swarm and sales outcomes'}
]);
const cases={
 'consented-conversion-recovery':({cro})=>{
  const total=count(cro?.humanFlaggedPageviews7d),clicks=count(cro?.observedCtaEvents7d),leads=count(cro?.recordedLeads30d);
  return {observed:total!==null&&clicks!==null&&total>0&&clicks===0,
    measurements:[evidence(total,'original 7d page events without robot flag'),evidence(clicks,'original persisted CTA events'),evidence(leads,'original 30d lead records')],
    reason:total===null||clicks===null?'CRO_SOURCE_UNVERIFIED':total>0&&clicks===0?'CTA_OBSERVATION_GAP':'NO_QUALIFYING_CTA_GAP_DETECTED'};
 },
 'next-natural-agent-learning':({proof})=>{
  const social=src(proof,'socialApplications'),revenue=src(proof,'revenueApplications');
  const a=trusted(social)?count(social.applied7d):null,b=trusted(revenue)?count(revenue.applied7d):null;
  return {observed:a===0&&b===0,
    measurements:[evidence(a,'original social application records 7d'),evidence(b,'original revenue application records 7d')],
    reason:a===null||b===null?'APPLICATION_SOURCE_UNVERIFIED':a===0&&b===0?'NO_FRESH_APPLICATION_EVIDENCE':'APPLICATIONS_OBSERVED_EFFECT_STILL_NEEDS_VERIFICATION'};
 },
 'customer-action-copilot':({proof})=>{
  const activity=src(proof,'portalActivity'),n=activity&&activity.status!=='UNVERIFIED'?count(activity.pageEvents):null;
  return {observed:n!==null&&activity.payingCustomersVerified===false,
    measurements:[evidence(n,'original scoped portal route events, possibly administrators/previews')],
    reason:n===null?'PORTAL_SCOPE_UNVERIFIED':'CUSTOMER_VALUE_AND_ACTUAL_TASK_EVIDENCE_DUE'};
 },
 'adaptive-portal-ux':({proof})=>{
  const x=src(proof,'portalActivity'),errors=x&&x.status!=='UNVERIFIED'?count(x.formErrors):null;
  const abandons=x&&x.status!=='UNVERIFIED'?count(x.formAbandons):null;
  return {observed:errors!==null&&abandons!==null,
    measurements:[evidence(errors,'original scoped portal form errors'),evidence(abandons,'original scoped portal form abandons')],
    reason:errors===null||abandons===null?'PORTAL_UX_SOURCE_UNVERIFIED':'CUSTOMER_COHORT_MISSING_NO_WINNER_PROVEN'};
 },
 'autonomous-agent-quality-ratchet':({proof})=>{
  const readiness=src(proof,'readiness'),runtime=src(proof,'runtime');
  const overdue=trusted(readiness)?count(readiness.overdue_obligations):null;
  const errors=trusted(runtime)?count(runtime.current_runtime_errors):null;
  return {observed:overdue!==null&&errors!==null&&(overdue>0||errors>0),
    measurements:[evidence(overdue,'original overdue learning obligations'),evidence(errors,'original current runtime errors')],
    reason:overdue===null||errors===null?'ENGINEERING_SOURCE_UNVERIFIED':'LEARNING_DEBT_OR_RUNTIME_ERRORS_OBSERVED'};
 },
 'evidence-backed-buyer-problem-discovery':({proof})=>{
  const r=src(proof,'revenue'),opportunities=trusted(r)?count(r.open_opportunities):null;
  const verified=trusted(r)?count(r.revenue_outcomes):null;
  return {observed:opportunities!==null&&verified!==null&&opportunities>0&&verified===0,
    measurements:[evidence(opportunities,'original open opportunities'),evidence(verified,'original registered revenue outcomes')],
    reason:opportunities===null||verified===null?'REVENUE_SOURCE_UNVERIFIED':'OPPORTUNITY_TO_PAID_OUTCOME_GAP'};
 }
};
/**
 * Deterministic innovation agenda from ACTUAL original admin read-model evidence.
 * Do not use attention_rank as predicted uplift; it is a bounded work-routing policy.
 */
export function buildAutonomousInnovationPortfolio({proof=null,cro=null,at=new Date().toISOString()}={}){
  const time=Date.parse(at);
  const clockOk=Number.isFinite(time)&&time>0;
  const rows=meta.map((plan,index)=>{
    const observed=clockOk?cases[plan.id]({proof,cro}):{
      observed:false,measurements:[],reason:'INVALID_TIME'};
    const sourceCompleteness=observed.measurements.length?
      observed.measurements.filter(x=>x.verified).length/observed.measurements.length:0;
    const sourceVerified=sourceCompleteness===1;
    // Routing order = business/customer urgency + real source observability.
    // Never presents forecasts, ROI or a model winner; NO auto deploy authority.
    const operationalRank=Number((index<2?30:index<4?20:10)+
      (observed.observed?10:0)+(sourceVerified?5:0));
    const stage=!sourceVerified?'MEASUREMENT_OR_SOURCE_REPAIR':
      observed.observed?'BOUNDED_OWNER_BUILD_CANDIDATE':'HYPOTHESIS_EVALUATION_DUE';
    return {
      fingerprint:'powerhouse|agent-innovation|'+plan.id+'|v1',
      id:plan.id,domain:plan.domain,owner:plan.owner,problem:plan.problem,
      technologyOptions:plan.tech,implementationBrief:plan.change,primaryOutcome:plan.metric,
      existingAuthority:plan.path,guardrails:plan.guards,
      stage,reason:observed.reason,attentionRank:operationalRank,
      evidence:observed.measurements,
      nextRequiredProof:'Exact protected source PR + Required/CodeQL + production SHA + next natural agent application + independently measured cohort/outcome',
      permission:'ORIGINAL_AGENT_MAY_BUILD_PROTECTED_CANDIDATE_ONLY',
      allowUnprotectedProductionMutation:false,
      automaticPromotionAuthorized:false,customerOrPaidOutcomeProven:false,
      appliedToNextNaturalAgentRunVerified:false
    };
  }).sort((a,b)=>b.attentionRank-a.attentionRank||a.id.localeCompare(b.id));
  return {
    contract:INNOVATION_CONTRACT,
    status:clockOk?'PROPOSALS_NOT_IMPLEMENTATION':'UNVERIFIED',
    observedAt:clockOk?new Date(time).toISOString():null,
    sourceAuthority:'original Powerhouse ONE BRAIN Heartbeat read-only admin contract',
    challengeRule:'Discover independently; compare existing champion and at least one reversible challenger with representative privacy-safe evaluation before promotion.',
    innovationCandidates:rows,
    executionContract:{
      executor:'EXISTING_POWERHOUSE_OWNER_AND_EXISTING_HEARTBEAT_ONLY',
      phases:['DISCOVER','EVIDENCE','DESIGN','PROTECTED_CANDIDATE','REQUIRED_CODEQL','EXACT_SHA_DEPLOY','PROVIDER_READBACK','NEXT_NATURAL_APPLICATION','CONTROLLED_OUTCOME','BRAIN_LEARNING'],
      noSecondScheduler:true,noNewPublisher:true,noClientPII:true,noNewCredentialGrants:true,
      noUnapprovedPaidSpend:true,noAutonomousPaymentOrLegalCommitment:true,
      exclusiveWriterRequired:true,existingModelEvaluationRequired:true,
      original15LoopTruthPreserved:true,releaseAndUpliftVerified:false
    }
  };
}
