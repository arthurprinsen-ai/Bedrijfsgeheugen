// Read-only, provenance-backed cooperation advice for the EXISTING hourly Janitor.
// Never treat a sampled slow job as a causal critical path or release authorization.
const GATES=Object.freeze(['Required','CodeQL','Supabase preview when applicable','RLS/tenant isolation','financial/visual parity','production/provider readback']);
const ACTIONS=Object.freeze({
  website:'COMPARE_EXACT_SHA_COLD_WARM_BUILD_AND_CONTENT_PARITY',
  'backend-supabase':'PROFILE_BOUNDED_DATABASE_OR_BACKEND_STEP_WITH_TENANT_GATES',
  portal:'PROFILE_AUTHENTICATED_PORTAL_STEP_WITH_SOURCE_AND_ROLE_PARITY',
  'one-brain':'REPLAY_EXISTING_BRAIN_EVALUATION_WITH_CANONICAL_LEARNING',
  heartbeat:'INSPECT_EXISTING_SCHEDULER_OR_JANITOR_JOB_WITH_SINGLE_OWNER',
  powerhouse:'MEASURE_EXISTING_REQUIRED_PREFLIGHT_PHASE_WITHOUT_SKIPPING_GATES',
  'owner-unresolved':'RESOLVE_CANONICAL_WORKFLOW_OWNER_BEFORE_MUTATION'
});
function laneOf(job){
  // Advisory string routing only: no permissions or test selections derive from these labels.
  const name=String(job.job_name||'').toLowerCase();
  const workflow=String(job.workflow_name||'').toLowerCase();
  if(/website|netlify|browser|visual|\bcls\b|i18n/.test(name))return 'website';
  if(/backend|supabase|database|\bsql\b/.test(name))return 'backend-supabase';
  if(/portal/.test(name))return 'portal';
  if(/\bbrain\b/.test(name))return 'one-brain';
  if(/heartbeat|cron|janitor|automation/.test(name))return 'heartbeat';
  if(/admission|preflight|codeql|security|\btest\b|hygiene/.test(name))return 'powerhouse';
  if(/repository janitor|heartbeat/.test(workflow))return 'heartbeat';
  return 'owner-unresolved';
}

export function routeObservedCiHotspots(telemetry={}, {maxOwners=3}={}){
  const base={
    schema:'powerhouse-ci-agent-evidence-priorities-v1',
    status:'WITHHELD_NO_TRUSTED_SAMPLE',
    parent_issue:4661,
    source:'GITHUB_EXECUTED_JOB_TIMESTAMPS',
    sample_not_critical_path:true,
    speedup_proven:false,
    may_mutate:false,
    may_dispatch:false,
    may_promote:false,
    mandatory_release_gates:GATES,
    priorities:[]
  };
  const jobs=telemetry?.diagnostic_hotspots?.jobs;
  if(telemetry?.status!=='SAMPLED_METRICS_NOT_SLO'||
      telemetry?.diagnostic_hotspots?.status!=='SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH'||
      !Array.isArray(telemetry?.read_errors)||telemetry.read_errors.length!==0||
      !Number.isSafeInteger(telemetry?.sample_jobs)||telemetry.sample_jobs<20||
      !Number.isSafeInteger(telemetry?.distinct_runs)||telemetry.distinct_runs<5||
      !Array.isArray(jobs)||jobs.length===0||jobs.length>5)return base;
  // Provider text and timestamps are observations, never trusted instructions.
  // One invalid or ambiguous top-job record suppresses the whole recommendation.
  const ids=new Set();
  const valid=jobs.every(job=>{
    const key=job?.run_id+':'+job?.run_attempt+':'+job?.job_id;
    if(!Number.isSafeInteger(job?.run_id)||!Number.isSafeInteger(job?.run_attempt)||
       job.run_attempt<1||!Number.isSafeInteger(job?.job_id)||
       !/^[a-f0-9]{40}$/i.test(job?.head_sha||'')||
       !['success','failure','timed_out'].includes(job?.conclusion)||
       !Number.isFinite(job?.execution_ms)||job.execution_ms<=0||
       !Number.isFinite(job?.wait_to_start_ms)||job.wait_to_start_ms<0||
       typeof job?.job_name!=='string'||!job.job_name.trim()||
       job.job_name.length>100||typeof job?.workflow_name!=='string'||
       job.workflow_name.length>100||ids.has(key))return false;
    ids.add(key);return true;
  });
  if(!valid)return {...base,status:'WITHHELD_INVALID_PROVENANCE'};
  const bound=Number.isSafeInteger(maxOwners)?Math.min(5,Math.max(1,maxOwners)):3;
  // One advisory slot per lane, so cooperating agents never receive duplicate
  // "owners" solely because one job has several runs in the top five.
  const byLane=new Map();
  for(const job of [...jobs].sort((a,b)=>b.execution_ms-a.execution_ms||a.run_id-b.run_id||a.job_id-b.job_id)){
    const lane=laneOf(job);
    if(!byLane.has(lane))byLane.set(lane,job);
  }
  const priorities=[...byLane].slice(0,bound).map(([lane,job],rank)=>({
    rank:rank+1,lane,
    owner_resolution_required:lane==='owner-unresolved',
    action:ACTIONS[lane],
    run_id:job.run_id,run_attempt:job.run_attempt,job_id:job.job_id,
    head_sha:job.head_sha,
    job_name:job.job_name,workflow_name:job.workflow_name,
    observed_execution_ms:job.execution_ms,
    observed_wait_ms:job.wait_to_start_ms,
    effect_unproven:true,
    next_gate:'CANONICAL_OWNER_LEASE_PLUS_COMPARABLE_COLD_WARM_REPLAY_AND_PROTECTED_CI'
  }));
  return {...base,status:'EVIDENCE_BACKED_INVESTIGATION_ONLY',priorities};
}
