// Read-only, provenance-backed cooperation advice for the EXISTING hourly Janitor.
// Never treat a sampled slow job as a causal critical path or release authorization.
const MAX_ADVICE_OBSERVATION_AGE_MS=2*60*60*1000; // Existing hourly Janitor + one recovery window.
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
// Security analysis cannot be optimized by changing an unrelated preflight step.
// Job and workflow names are advisory provider data, never execution instructions.
function advisoryActionFor(lane,job){
  const jobName=String(job?.job_name||'');
  const workflowName=String(job?.workflow_name||'');
  if(/\bcodeql\b/i.test(jobName)||/\bcodeql\b/i.test(workflowName)){
    return 'PROFILE_CODEQL_ANALYSIS_RUNTIME_PRESERVING_FULL_SECURITY_GATES';
  }
  return ACTIONS[lane];
}

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

// Repeat evidence is only authoritative if it reconciles with the ORIGINAL
// executed job rows from this same observation, not a mutable downstream label.
// Every workflow attempt contributes at most its slowest matrix job.
function validateRecurrentHotspots(telemetry){
  const recurrent=telemetry?.recurrent_hotspots;
  if(recurrent?.status!=='REPEATED_JOB_SAMPLE_NOT_SLO')return {valid:true,rows:[]};
  const evidence=telemetry?.job_evidence,declared=recurrent?.jobs;
  if(!Array.isArray(evidence)||evidence.length!==telemetry.sample_jobs||
     !Array.isArray(declared)||declared.length<1||declared.length>5||
     recurrent.minimum_distinct_attempts!==3)return {valid:false,rows:[]};
  const identities=new Set(),attempts=new Set();
  for(const row of evidence){
    const identity=row?.run_id+':'+row?.run_attempt+':'+row?.job_id;
    if(!Number.isSafeInteger(row?.run_id)||!Number.isSafeInteger(row?.run_attempt)||
       row.run_attempt<1||!Number.isSafeInteger(row?.job_id)||
       !/^[0-9a-f]{40}$/i.test(row?.head_sha||'')||
       !['success','failure','timed_out'].includes(row?.conclusion)||
       !Number.isFinite(row?.execution_ms)||row.execution_ms<0||
       !Number.isFinite(row?.wait_to_start_ms)||row.wait_to_start_ms<0||
       identities.has(identity))return {valid:false,rows:[]};
    identities.add(identity);
    attempts.add(row.run_id+':'+row.run_attempt);
  }
  if(attempts.size!==telemetry.distinct_runs)return {valid:false,rows:[]};
  const claimed=new Set(),ranked=[];
  for(const group of declared){
    const key=group?.workflow_id+':'+group?.job_name;
    if(!Number.isSafeInteger(group?.workflow_id)||group.workflow_id<1||
       typeof group?.job_name!=='string'||!group.job_name.trim()||
       group.job_name.length>100||claimed.has(key)||
       !Number.isSafeInteger(group?.distinct_attempts)||group.distinct_attempts<3||
       !Number.isFinite(group?.sample_p50_execution_ms)||
       !Number.isFinite(group?.sample_max_execution_ms)||
       !Array.isArray(group?.representative_run_ids))return {valid:false,rows:[]};
    claimed.add(key);
    const perAttempt=new Map();
    for(const row of evidence){
      if(row.workflow_id!==group.workflow_id||row.job_name!==group.job_name)continue;
      const id=row.run_id+':'+row.run_attempt,prev=perAttempt.get(id);
      if(!prev||row.execution_ms>prev.execution_ms)perAttempt.set(id,row);
    }
    if(perAttempt.size!==group.distinct_attempts)return {valid:false,rows:[]};
    const rows=[...perAttempt.values()];
    const values=rows.map(r=>r.execution_ms).sort((a,b)=>a-b);
    const median=values[Math.max(0,Math.ceil(values.length/2)-1)];
    const maximal=values[values.length-1];
    if(median!==group.sample_p50_execution_ms||maximal!==group.sample_max_execution_ms||
       group.representative_run_ids.length!==Math.min(rows.length,6)||
       group.representative_run_ids.some(id=>!rows.some(r=>r.run_id===id)))
      return {valid:false,rows:[]};
    // Exact recorded run/attempt/job/SHA identifies the real exemplar;
    // sample median, not its maximum, drives repeat-first priority.
    const exemplar=[...rows].sort((a,b)=>b.execution_ms-a.execution_ms||
      a.run_id-b.run_id||a.job_id-b.job_id)[0];
    ranked.push({...exemplar,repeat_attempts:rows.length,
      repeated_p50_execution_ms:median,evidence_basis:'REPEATED_INDEPENDENT_ATTEMPTS'});
  }
  ranked.sort((a,b)=>b.repeated_p50_execution_ms-a.repeated_p50_execution_ms||
    b.repeat_attempts-a.repeat_attempts||a.run_id-b.run_id||a.job_id-b.job_id);
  return {valid:true,rows:ranked};
}

export function routeObservedCiHotspots(telemetry={}, {maxOwners=3,now=Date.now()}={}){
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
  // Janitor JSON can outlive its owner lease, the deployment, or the incident.
  // Do not tell agents an old (or future-dated) observation is current evidence.
  const stamp=telemetry?.observed_at;
  const observed=typeof stamp==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(stamp)
    ?Date.parse(stamp):NaN;
  const age=Number(now)-observed;
  if(!Number.isFinite(observed)||!Number.isFinite(Number(now))||!Number.isFinite(age)||
     new Date(observed).toISOString()!==stamp||age<0||age>MAX_ADVICE_OBSERVATION_AGE_MS){
    return {...base,status:'WITHHELD_STALE_OR_UNDATED_OBSERVATION'};
  }
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
  const recurrent=validateRecurrentHotspots(telemetry);
  if(!recurrent.valid)return {...base,status:'WITHHELD_UNVERIFIED_RECURRENT_PROOF'};
  // Repeated median evidence outranks a one-off maximum; existing top-five
  // diagnostics fill only remaining owner lanes. Advice never grants writes.
  const oneOffs=[...jobs].sort((a,b)=>b.execution_ms-a.execution_ms||
    a.run_id-b.run_id||a.job_id-b.job_id);
  const byLane=new Map();
  for(const job of [...recurrent.rows,...oneOffs]){
    const lane=laneOf(job);
    if(!byLane.has(lane))byLane.set(lane,job);
  }
  const priorities=[...byLane].slice(0,bound).map(([lane,job],rank)=>({
    rank:rank+1,lane,
    owner_resolution_required:lane==='owner-unresolved',
    action:advisoryActionFor(lane,job),
    run_id:job.run_id,run_attempt:job.run_attempt,job_id:job.job_id,
    head_sha:job.head_sha,
    job_name:job.job_name,workflow_name:job.workflow_name,
    observed_execution_ms:job.execution_ms,
    observed_wait_ms:job.wait_to_start_ms,
    evidence_basis:job.evidence_basis||'ONE_OFF_PEAK_NOT_RECURRENT',
    repeated_attempts:job.repeat_attempts||null,
    repeated_sample_p50_execution_ms:job.repeated_p50_execution_ms??null,
    effect_unproven:true,
    next_gate:'CANONICAL_OWNER_LEASE_PLUS_COMPARABLE_COLD_WARM_REPLAY_AND_PROTECTED_CI'
  }));
  return {...base,status:'EVIDENCE_BACKED_INVESTIGATION_ONLY',priorities};
}
