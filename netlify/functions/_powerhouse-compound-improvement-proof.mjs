// Read-only synthesis for the ORIGINAL Powerhouse / ONE BRAIN / Heartbeat owners.
// This does not create another truth store, scheduler, customer identity or action writer.
const MINUTE=60_000;
const DAY=86_400_000;
const num=(value)=>{
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?n:null;
};
const integer=(value)=>{
  const n=num(value);
  return n!==null&&Number.isSafeInteger(n)?n:null;
};
const timestamp=(value)=>{
  const t=typeof value==='string'?Date.parse(value):NaN;
  return Number.isFinite(t)?t:null;
};
const liveRow=(rows,state,timeField,now)=>{
  if(state!=='LIVE'||!Array.isArray(rows)||rows.length!==1)return null;
  const row=rows[0];
  const t=timestamp(row?.[timeField]);
  if(t===null||t>now+5*MINUTE||now-t>90*MINUTE)return null;
  return row;
};
const unknown=(reason)=>({status:'UNVERIFIED',reason});

function applicationWindow(rows,state,now){
  if(state!=='LIVE'||!Array.isArray(rows))return unknown('ORIGINAL_APPLICATION_SOURCE_UNAVAILABLE_OR_TRUNCATED');
  let applied7d=0,measuredEffects7d=0,independentVerifiedEffects7d=0;
  const seen=new Set();
  for(const row of rows){
    if(!['canonical','bedrijfsgeheugen'].includes(row?.tenant_id))return unknown('APPLICATION_TENANT_SCOPE_INVALID');
    if(typeof row?.application_id!=='string'||!row.application_id||typeof row.learning_id!=='string'||!row.learning_id)
      return unknown('APPLICATION_IDENTITY_UNVERIFIED');
    const identity=row.tenant_id+':'+row.application_id;
    if(seen.has(identity))return unknown('DUPLICATE_APPLICATION_IDENTITY');
    seen.add(identity);
    const t=timestamp(row.applied_at);
    if(t===null||t>now+5*MINUTE)return unknown('APPLICATION_TIME_UNVERIFIED');
    if(now-t>7*DAY)continue;
    applied7d++;
    // This is a stored retrospective effect, not proof of causal uplift.
    if(row.actual_effect!==null&&row.actual_effect!==undefined&&Number.isFinite(Number(row.actual_effect)))
      measuredEffects7d++;
    if(row.verification_status==='VERIFIED'||row.verification_status==='PROVEN'){
      if(row.actual_effect!==null&&row.actual_effect!==undefined&&Number.isFinite(Number(row.actual_effect)))
        independentVerifiedEffects7d++;
    }
  }
  return {status:'READBACK_COMPLETE',reason:null,applied7d,measuredEffects7d,
    independentVerifiedEffects7d,seenApplications:seen.size,scope:'canonical + bedrijfsgeheugen (tenant-qualified only)',
    note:'Recorded application and measured effects do not prove a new natural agent consumed the learning or caused sales uplift.'};
}

function portalActivity(behavior,sourceState,now){
  if(sourceState!=='LIVE'||!Array.isArray(behavior))return unknown('ORIGINAL_PORTAL_BEHAVIOR_SOURCE_UNAVAILABLE');
  const selected=behavior.filter(row=>/^\/(?:portal-v2|klantportaal|portaal|mijn)(?:\/|$)/i.test(String(row?.pad||'')));
  let pageEvents=0,receiptObservations=0,formStarts=0,formErrors=0,formAbandons=0;
  const paths=new Set();
  for(const row of selected){
    const values=['page_events','persisted_event_receipts','form_starts','form_errors','form_abandons'].map(key=>integer(row[key]));
    if(values.some(value=>value===null))return unknown('ORIGINAL_PORTAL_METRIC_INVALID');
    pageEvents+=values[0];receiptObservations+=values[1];formStarts+=values[2];
    formErrors+=values[3];formAbandons+=values[4];
    paths.add(String(row.pad));
    const when=timestamp(row.last_observed_at);
    if(when!==null&&when>now+5*MINUTE)return unknown('PORTAL_OBSERVATION_IN_FUTURE');
  }
  return {status:selected.length?'PORTAL_ACTIVITY_OBSERVED_NOT_CUSTOMER_VALUE':'PORTAL_ACTIVITY_EVIDENCE_DUE',
    reason:selected.length?'ACTIVITY_NOT_INDEPENDENT_CUSTOMER_ACTIVATION':'NO_SCOPED_PORTAL_OBSERVATIONS',
    pageEvents,receiptObservations,formStarts,formErrors,formAbandons,pathsObserved:paths.size,
    eligibleDaysUnknown:true,payingCustomersVerified:false,activatedCustomersVerified:false,
    customerTaskCompletionVerified:false,retentionVerified:false,upgradeVerified:false,
    note:'Portal paths can include administrators and previews. No individual identities, paid customers or unique visitors are inferred.'};
}

function safeReadiness(row){
  if(!row)return unknown('ORIGINAL_LEARNING_READINESS_UNAVAILABLE');
  const fields=['open_obligations','overdue_obligations','missing_outcome_evidence',
    'missing_economics_evidence','missing_feedback_evidence','overdue_system_obligations'];
  const counts={};
  for(const key of fields){
    const n=integer(row[key]);if(n===null)return unknown('LEARNING_READINESS_METRIC_UNVERIFIED');
    counts[key]=n;
  }
  return {status:'READBACK_COMPLETE',...counts,observedAt:row.observed_at};
}
function safeRevenue(row){
  if(!row)return unknown('ORIGINAL_REVENUE_READBACK_UNAVAILABLE');
  const counts=['open_opportunities','executed_actions','revenue_outcomes','due_uncalibrated_forecasts',
    'pending_external_outcomes'];
  const out={};
  for(const key of counts){
    const n=integer(row[key]);if(n===null)return unknown('REVENUE_METRIC_UNVERIFIED');out[key]=n;
  }
  const eur=num(row.realized_revenue_eur);
  if(eur===null)return unknown('REALIZED_REVENUE_SOURCE_INVALID');
  return {status:'READBACK_COMPLETE',...out,realizedRevenueEur:eur,
    observedAt:row.measured_at,
    qualifiedPaidAttributionVerified:false,
    note:'An aggregate revenue snapshot alone does not link individual customer, campaign, payment provider and applied learning.'};
}
function safeRuntime(row){
  if(!row)return unknown('ORIGINAL_RUNTIME_READBACK_UNAVAILABLE');
  const keys=['total_layers','wired_layers','required_jobs','active_jobs','current_runtime_errors',
    'evidence_sparse_required_layers'];
  const data={};
  for(const k of keys){const n=integer(row[k]);if(n===null)return unknown('ORIGINAL_RUNTIME_COUNTER_INVALID');data[k]=n;}
  return {status:'READBACK_COMPLETE',...data,architectureState:String(row.architecture_state||'UNKNOWN').slice(0,50),
    observedAt:row.observed_at,regressionReductionVerified:false};
}

/**
 * ONE ADMIN READ-MODEL; original Supabase views and app records retain ownership.
 * Never replace original 15-loop guard, customer RLS or actual payment authority.
 * Produces evidence and priorities for EXISTING agents, not any new executor.
 */
export function projectCompoundImprovementProof({
  learningReadiness=[],revenueFlywheel=[],runtimeHealth=[],
  socialApplications=[],revenueApplications=[],portalBehavior=[],
  readStates={},at=new Date().toISOString()
}={}){
  const now=timestamp(at);
  if(now===null)return {contract:'POWERHOUSE_COMPOUND_IMPROVEMENT_READONLY_V1',status:'UNVERIFIED',
    reason:'INVALID_READBACK_CLOCK',loops:[],priorities:[],evidenceSources:{}};
  const readiness=safeReadiness(liveRow(learningReadiness,readStates.learningReadiness,'observed_at',now));
  const revenue=safeRevenue(liveRow(revenueFlywheel,readStates.revenueFlywheel,'measured_at',now));
  const runtime=safeRuntime(liveRow(runtimeHealth,readStates.runtimeHealth,'observed_at',now));
  const social=applicationWindow(socialApplications,readStates.socialApplications,now);
  const salesLearning=applicationWindow(revenueApplications,readStates.revenueApplications,now);
  const portal=portalActivity(portalBehavior,readStates.behavior,now);
  const originalOk=o=>o?.status==='READBACK_COMPLETE';
  const commercialOk=originalOk(revenue)&&originalOk(salesLearning)&&originalOk(social);
  const learningOk=originalOk(readiness)&&originalOk(runtime)&&originalOk(social)&&originalOk(salesLearning);
  const customerOk=portal.status!=='UNVERIFIED';
  const loops=[
    {key:'commercial-to-next-action',owner:'original Powerhouse Growth/Revenue and social/content owners',
      status:commercialOk?(revenue.realizedRevenueEur>0?'REVENUE_OBSERVED_ATTRIBUTION_PENDING':'PAID_OUTCOME_EVIDENCE_DUE'):'UNVERIFIED',
      observed:{openOpportunities:originalOk(revenue)?revenue.open_opportunities:null,
        executedActions:originalOk(revenue)?revenue.executed_actions:null,
        realizedRevenueEur:originalOk(revenue)?revenue.realizedRevenueEur:null,
        providerVerifiedPaidAttribution:false,
        socialLearningApplications7d:originalOk(social)?social.applied7d:null,
        revenueLearningApplications7d:originalOk(salesLearning)?salesLearning.applied7d:null},
      nextProof:'Actual provider-authorized event → consented qualified lead → quote → independent payment → same source learning applied and evaluated on next natural action.'},
    {key:'customer-portal-to-better-product',owner:'original Portal V2/customer success and CRO experiment owners',
      status:customerOk?'CUSTOMER_VALUE_OUTCOME_EVIDENCE_DUE':'UNVERIFIED',
      observed:{portalRoutePageEvents:customerOk?portal.pageEvents:null,
        portalFormErrors:customerOk?portal.formErrors:null,
        portalFormAbandons:customerOk?portal.formAbandons:null,
        portalPathsObserved:customerOk?portal.pathsObserved:null,
        payingCustomersVerified:false,customerTaskCompletionVerified:false,retentionVerified:false},
      nextProof:'Use existing authorized tenant-scoped portal activity and customer feedback; measure activation, task completion and retention in controlled cohorts before a customer-value win.'},
    {key:'incident-to-prevented-repeat',owner:'original ONE BRAIN/Heartbeat/self-improvement and release owners',
      status:learningOk?'REGRESSION_PREVENTION_EFFECT_DUE':'UNVERIFIED',
      observed:{openLearningObligations:originalOk(readiness)?readiness.open_obligations:null,
        overdueLearningObligations:originalOk(readiness)?readiness.overdue_obligations:null,
        missingFeedbackEvidence:originalOk(readiness)?readiness.missing_feedback_evidence:null,
        runtimeErrors:originalOk(runtime)?runtime.current_runtime_errors:null,
        activeJobs:originalOk(runtime)?runtime.active_jobs:null,
        requiredJobs:originalOk(runtime)?runtime.required_jobs:null,
        measuredSocialEffects7d:originalOk(social)?social.measuredEffects7d:null,
        measuredRevenueEffects7d:originalOk(salesLearning)?salesLearning.measuredEffects7d:null},
      nextProof:'Same fingerprint cause → safe protected fix → exact production readback → subsequent natural execution → independent recurrence reduction and learning application.'}
  ];
  const priorities=[
    {priority:1,key:'verify-conversion-source-to-paid-outcome',owner:'existing Growth/SEO CRO + Revenue Flywheel',
      status:'REQUIRES_EVIDENCE',basis:'ORIGINAL_REVENUE_AND_CRO_SOURCE',
      next:'Fix original consented CTA→lead→provider payment ID attribution; no synthetic traffic, duplicate outreach or payment claims.'},
    {priority:2,key:'apply-evaluated-learning-in-next-natural-action',owner:'existing ONE BRAIN/Content Growth/Revenue agents',
      status:'REQUIRES_EVIDENCE',basis:'SOCIAL_AND_REVENUE_LEARNING_APPLICATIONS',
      next:'Read previous scoped source/cohort; record actual next content/action consumption and follow-up effect, not just learning existence.'},
    {priority:3,key:'measure-customer-portal-value',owner:'existing Portal V2/customer success/CRO experiment owner',
      status:'REQUIRES_EVIDENCE',basis:'ORIGINAL_SCOPED_PORTAL_BEHAVIOR',
      next:'Observe authorized customer activation/task completion/retention and feedback with tenant isolation; use existing experiment guard before UX winner promotion.'},
    {priority:4,key:'close-recurrence-and-feedback-debt',owner:'existing ONE BRAIN/Heartbeat/Self-Improvement',
      status:'REQUIRES_EVIDENCE',basis:'ORIGINAL_LEARNING_READINESS_AND_RUNTIME',
      next:'Prioritize overdue original learning obligations and prevent repeat failures with exact regression and next-run verified application.'}
  ];
  return {contract:'POWERHOUSE_COMPOUND_IMPROVEMENT_READONLY_V1',
    status:commercialOk&&learningOk&&customerOk?'EVIDENCE_DUE':'PARTIAL_SOURCE_READBACK',
    at:new Date(now).toISOString(),source:'existing canonical Powerhouse/ONE BRAIN/Heartbeat',
    loops,priorities,evidenceSources:{
      readiness,revenue,runtime,socialApplications:social,revenueApplications:salesLearning,portalActivity:portal
    },
    guarantees:{newScheduledExecutors:0,newWriters:0,externalSideEffects:0,
      customerOrPaymentIdentityInOutput:false,tenantScopePreserved:true,
      original15LoopStatusUnchanged:true,causalUpliftProven:false,
      recurringDailyGrowthGuaranteed:false}
  };
}
