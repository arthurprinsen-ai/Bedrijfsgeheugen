// Read-only, bounded advisory from the EXISTING Janitor CI throughput artifact.
// No GitHub API calls, additional scheduler, model invocation, workflow dispatch or status mutation.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const INPUT='.artifacts/powerhouse-ci-throughput.json';
const OUT='.artifacts/powerhouse-ci-agent-priorities.json';
const EXECUTED=new Set(['success','failure','timed_out']);
function laneOf(workflow,job){
  const text=(workflow+' '+job).toLowerCase();
  if(/codeql|security|sast/.test(text))return 'security-review';
  if(/browser|netlify|website|visual|cls|playwright/.test(text))return 'website';
  if(/supabase|backend|migration/.test(text))return 'backend-supabase';
  if(/portal/.test(text))return 'portal';
  if(/brain|learning|model/.test(text))return 'one-brain';
  if(/janitor|preflight|hygiene|powerhouse|ci[- ]/.test(text))return 'powerhouse';
  return 'unassigned';
}
const percentile=(values,fraction)=>{
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil(sorted.length*fraction)-1)];
};
const deny=(status,reason,sampledJobs=0)=>Object.freeze({
  schema:'powerhouse-ci-agent-priorities-v1',status,reason,
  sampled_jobs:sampledJobs,priorities:Object.freeze([]),
  provenance:'EXISTING_JANITOR_PROVIDER_TIMESTAMPS',
  can_mutate:false,can_dispatch:false,can_promote:false
});
export function prioritizeObservedCiWork(telemetry,{minRepeatedRuns=3,minMedianMs=60000,maxPriorities=5}={}){
  const rows=telemetry?.job_evidence;
  if(telemetry?.status!=='SAMPLED_METRICS_NOT_SLO'||
     !Array.isArray(rows)||telemetry?.read_errors?.length||
     !Number.isSafeInteger(telemetry?.sample_jobs)||
     !Number.isSafeInteger(telemetry?.distinct_runs)||
     telemetry.sample_jobs<20||telemetry.distinct_runs<5||
     rows.length!==telemetry.sample_jobs){
    return deny('INSUFFICIENT_EVIDENCE','INCOMPLETE_OR_UNTRUSTED_TELEMETRY');
  }
  // Advisory tuning cannot weaken the evidence contract owned by the canonical Janitor.
  const repeatedRunFloor=Number.isSafeInteger(minRepeatedRuns)&&minRepeatedRuns>=3?minRepeatedRuns:3;
  const medianFloorMs=Number.isSafeInteger(minMedianMs)&&minMedianMs>=60000?minMedianMs:60000;
  const priorityLimit=Number.isSafeInteger(maxPriorities)&&maxPriorities>=1?Math.min(5,maxPriorities):5;
  const unique=new Set(),groups=new Map(),attempts=new Set(),attemptShas=new Map();
  for(const row of rows){
    const run=row?.run_id,attempt=row?.run_attempt,job=row?.job_id;
    const sha=row?.head_sha,workflow=String(row?.workflow_name||'').trim();
    const name=String(row?.job_name||'').trim();
    const duration=row?.execution_ms,wait=row?.wait_to_start_ms;
    const id=run+':'+attempt+':'+job;
    if(!Number.isSafeInteger(run)||!Number.isSafeInteger(attempt)||attempt<1||
       !Number.isSafeInteger(job)||!/^[0-9a-f]{40}$/i.test(sha||'')||
       !workflow||workflow.length>100||!name||name.length>100||
       !EXECUTED.has(row?.conclusion)||!Number.isSafeInteger(duration)||
       !Number.isSafeInteger(wait)||duration<0||wait<0||
       duration>172800000||wait>172800000||unique.has(id)){
      return deny('EVIDENCE_REJECTED','INVALID_OR_DUPLICATE_PROVIDER_JOB',rows.length);
    }
    const attemptKey=run+':'+attempt;
    // The same workflow attempt cannot legitimately carry two distinct HEAD SHAs.
    const knownSha=attemptShas.get(attemptKey);
    if(knownSha&&knownSha.toLowerCase()!==sha.toLowerCase())
      return deny('EVIDENCE_REJECTED','RUN_ATTEMPT_SHA_INCONSISTENT',rows.length);
    attemptShas.set(attemptKey,sha);
    unique.add(id);attempts.add(attemptKey);
    const key=(Number.isSafeInteger(row.workflow_id)?'id:'+row.workflow_id:'name:'+workflow)+'|'+name;
    if(!groups.has(key))groups.set(key,{workflow,job:name,lane:laneOf(workflow,name),jobs:[],perAttempt:new Map(),shaSet:new Set()});
    const group=groups.get(key);
    const observed={run_id:run,run_attempt:attempt,job_id:job,head_sha:sha,execution_ms:duration,wait_to_start_ms:wait};
    group.jobs.push(observed);
    const prior=group.perAttempt.get(attemptKey);
    // A matrix fan-out contributes one conservative observation per independent
    // workflow attempt, not N votes in the median or in p95.
    if(!prior||observed.execution_ms>prior.execution_ms||
       (observed.execution_ms===prior.execution_ms&&observed.job_id<prior.job_id)){
      group.perAttempt.set(attemptKey,observed);
    }
    group.shaSet.add(sha);
  }
  if(attempts.size!==telemetry.distinct_runs)
    return deny('EVIDENCE_REJECTED','DISTINCT_ATTEMPT_COUNT_MISMATCH',rows.length);
  const ranked=[];
  for(const [key,group] of groups){
    const independentJobs=[...group.perAttempt.values()];
    const attemptsCount=independentJobs.length;
    if(attemptsCount<repeatedRunFloor)continue;
    const median=percentile(independentJobs.map(j=>j.execution_ms),.5);
    if(median<medianFloorMs)continue;
    ranked.push(Object.freeze({
      signature:key,workflow_name:group.workflow,job_name:group.job,
      suggested_lane:group.lane,independent_run_attempts:attemptsCount,
      sample_jobs:group.jobs.length,independent_attempt_samples:independentJobs.length,
      matrix_replica_samples_excluded:group.jobs.length-independentJobs.length,
      distinct_head_shas:group.shaSet.size,
      median_execution_ms:median,p95_execution_ms:percentile(independentJobs.map(j=>j.execution_ms),.95),
      median_wait_ms:percentile(independentJobs.map(j=>j.wait_to_start_ms),.5),
      evidence:Object.freeze([...independentJobs].sort((a,b)=>b.execution_ms-a.execution_ms||a.job_id-b.job_id)
        .slice(0,3).map(j=>Object.freeze(j))),
      proposed_action:'INVESTIGATE_AND_BENCHMARK_WITH_EXISTING_OWNER',
      proof_level:'REPEATED_OBSERVATION_NOT_CAUSAL_OR_PERFORMANCE_GAIN'
    }));
  }
  ranked.sort((a,b)=>b.median_execution_ms-a.median_execution_ms||
    b.independent_run_attempts-a.independent_run_attempts||a.signature.localeCompare(b.signature));
  return Object.freeze({
    schema:'powerhouse-ci-agent-priorities-v1',
    status:ranked.length?'REPEATED_SLOW_JOB_ADVISORY':'NO_REPEATED_SLOW_JOB_PROVEN',
    reason:ranked.length?'MULTIPLE_DISTINCT_WORKFLOW_ATTEMPTS':'NO_THRESHOLD_CROSSING_GROUP',
    observed_at:telemetry.observed_at||null,sampled_jobs:rows.length,
    distinct_runs:attempts.size,min_repeated_runs:repeatedRunFloor,min_median_ms:medianFloorMs,
    priorities:Object.freeze(ranked.slice(0,priorityLimit)),
    provenance:'EXISTING_JANITOR_PROVIDER_TIMESTAMPS',
    can_mutate:false,can_dispatch:false,can_promote:false
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  let result;
  try{
    const raw=JSON.parse(await readFile(INPUT,'utf8'));
    result=prioritizeObservedCiWork(raw);
  }catch(error){
    result=deny('PROVIDER_OBSERVATION_UNAVAILABLE','NO_VALID_LOCAL_TELEMETRY');
  }
  await mkdir('.artifacts',{recursive:true});
  await writeFile(OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({status:result.status,priority_count:result.priorities.length,
    highest_median_ms:result.priorities[0]?.median_execution_ms??null}));
}
