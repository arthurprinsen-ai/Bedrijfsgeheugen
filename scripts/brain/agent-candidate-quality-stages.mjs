// Preflight quality protocol for new autonomous technique/model/optimization proposals.
// This is an evidence SHAPE gate, never independent provider verification or release authority.
// The existing protected CI, security, production readback and one-writer lease remain authoritative.
const SHA=/^[a-f0-9]{40}$/i;
const TEST=/^tests\/brain-[a-z0-9_.-]+\.test\.mjs$/;
const EXPERIMENT_KINDS=new Set(['innovation','model_upgrade','new_technique','autonomous_optimization']);
const URI=value=>{
  if(typeof value!=='string'||value.length>1024)return false;
  try {
    const u=new URL(value);
    return u.protocol==='https:' && !!u.hostname && !u.username && !u.password &&
      !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname);
  }catch{return false;}
};
const present=v=>typeof v==='string'&&v.trim().length>=12&&v.length<=1000;
const finite=n=>typeof n==='number'&&Number.isFinite(n);

export function evaluateAgentCandidateQuality({
  workPackage={},now=Date.now()
}={}){
  const packet=workPackage.innovation;
  const explicit=packet!==undefined || EXPERIMENT_KINDS.has(workPackage.candidateType);
  if(!explicit)return Object.freeze({applies:false,status:'LEGACY_STANDARD_PROTECTED_CHECKS',
    canPlanLocalExperiment:true,mayDispatch:false,mayPromote:false,mayWriteProduction:false,
    missing:Object.freeze([]),stages:Object.freeze([])});
  const missing=[];
  const requireStep=(ok,key)=>{if(!ok)missing.push(key);return ok;};
  if(!packet || typeof packet!=='object'||Array.isArray(packet)){
    requireStep(false,'INNOVATION_PACKET_REQUIRED');
  }
  const x=packet&&typeof packet==='object'&&!Array.isArray(packet)?packet:{};
  const lease=x.lease||{},source=x.source||{},baseline=x.baseline||{},experiment=x.experiment||{},safety=x.safety||{};
  const timestamp=Date.parse(source.observedAt||'');
  const nowMs=Number(now);
  const sourceRecent=Number.isFinite(nowMs)&&Number.isFinite(timestamp)&&timestamp<=nowMs&&
    timestamp>=nowMs-30*86400_000;
  const ownerOk=requireStep(present(String(x.hypothesis||'')),'HYPOTHESIS_REQUIRED')&&
    requireStep(present(String(x.customerOrEngineeringGoal||'')),'GOAL_REQUIRED');
  requireStep(Boolean(typeof workPackage.obligationId==='string'&&workPackage.obligationId.trim()&&
    lease.obligationId===workPackage.obligationId&&present(lease.owner)&&
    SHA.test(workPackage.baseSha||'')&&SHA.test(workPackage.candidateSha||'')&&
    lease.mainSha===workPackage.baseSha&&lease.headSha===workPackage.candidateSha),
    'CANONICAL_WRITER_LEASE_AND_EXACT_SHA_REQUIRED');
  requireStep(URI(source.url)&&sourceRecent&&source.kind&&
    ['official','provider','internal'].includes(source.kind),
    'RECENT_SOURCE_PROVENANCE_REQUIRED');
  requireStep(present(baseline.metric)&&finite(baseline.value)&&baseline.observations>=30&&
    Number.isSafeInteger(baseline.observations)&&
    ['higher','lower'].includes(baseline.direction)&&URI(baseline.evidenceUrl),
    'INDEPENDENT_BASELINE_30_OBSERVATIONS_REQUIRED');
  requireStep(Array.isArray(experiment.replayTests)&&experiment.replayTests.length>0&&
    experiment.replayTests.length<=12&&experiment.replayTests.every(p=>TEST.test(p))&&
    new Set(experiment.replayTests).size===experiment.replayTests.length,
    'CANONICAL_REPLAY_TESTS_REQUIRED');
  requireStep(present(experiment.shadowPlan)&&present(experiment.canaryPlan)&&
    present(experiment.rollbackPlan)&&present(experiment.comparisonPlan),
    'SHADOW_CANARY_CONTROL_AND_ROLLBACK_PLAN_REQUIRED');
  requireStep(safety.requiredCi===true&&safety.codeql===true&&
    safety.tenantIsolation===true&&safety.providerReadback===true&&
    safety.noAutonomousSpend===true&&safety.noPermissionEscalation===true,
    'SECURITY_TENANT_PROVIDER_AND_SPEND_GUARDRAILS_REQUIRED');
  requireStep(['low','medium'].includes(x.risk),
    'HIGH_RISK_REQUIRES_SEPARATE_HUMAN_AUTHORITY');
  const ready=missing.length===0;
  const stages=[
    {id:'source_and_owner',state:ready?'PRE_REGISTERED_NOT_PROVIDER_VERIFIED':'HOLD_MISSING_EVIDENCE'},
    {id:'historical_replay',state:ready?'PLANNED_NOT_EXECUTED':'HOLD_MISSING_EVIDENCE'},
    {id:'shadow_evaluation',state:'BLOCKED_UNTIL_REAL_REPLAY_PROOF'},
    {id:'bounded_canary',state:'BLOCKED_UNTIL_INDEPENDENT_SHADOW_PROOF'},
    {id:'protected_ci_and_provider_readback',state:'REQUIRED_EXTERNAL_AUTHORITY'},
    {id:'verified_customer_or_engineering_outcome',state:'NO_CLAIM_WITHOUT_OBSERVED_CONTROL'},
    {id:'canonical_learning_and_rollback',state:'REQUIRES_EXISTING_BRAIN_WRITEBACK'}
  ];
  return Object.freeze({
    applies:true,
    status:ready?'READY_FOR_NONPRODUCTION_CANDIDATE_CI':'QUALITY_STEPS_HOLD',
    // Self-authored plans/URLs are not independent proof, so never grant terminal authority.
    canPlanLocalExperiment:ready,
    mayDispatch:false,mayPromote:false,mayWriteProduction:false,
    providerVerified:false,benefitProven:false,
    missing:Object.freeze(missing),
    stages:Object.freeze(stages.map(stage=>Object.freeze(stage))),
    hypothesisPresent:ownerOk
  });
}
