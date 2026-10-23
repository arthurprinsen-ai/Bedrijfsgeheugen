// Read-only evidence of ACTUAL Recovery Supervisor runs for the EXISTING hourly Repository Janitor.
// Never mutate a PR, start CI, relax gates, declare a deployment, or add a scheduler.
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {buildSupervisorDailyLearning} from './recovery-supervisor-daily-learning.mjs';
import {pathToFileURL} from 'node:url';

const WF='powerhouse-delivery-recovery-supervisor.yml';
const OUT='.artifacts/powerhouse-supervisor-execution-evidence.json';
const SHA=/^[a-f0-9]{40}$/i;
const KNOWN=new Map([
  ['MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED','RETRY_BUDGET_EXHAUSTED'],
  ['MAIN_DRIFT_PREFLIGHT_CHANGED','PREWRITE_HEAD_OR_MAIN_RACE'],
  ['MAIN_DRIFT_LEASE_BODY_CHANGED','LEASE_METADATA_RACE'],
  ['MAIN_DRIFT_SYNC_RACE','POSTWRITE_METADATA_RACE'],
  ['MAIN_DRIFT_SYNC_UNVERIFIED','ANCESTRY_PROOF_MISSING'],
  ['MAIN_DRIFT_UPDATE_UNVERIFIED','ANCESTRY_PROOF_MISSING'],
  ['MAIN_DRIFT_SYNC_TIMED_OUT','ASYNC_TIMEOUT_UNVERIFIED'],
  ['MAIN_DRIFT_ASYNC_PENDING','ASYNC_PENDING_NOT_FAILED'],
  ['MAIN_DRIFT_SYNC_PENDING','ASYNC_PENDING_NOT_FAILED'],
  ['MAIN_DRIFT_SYNC_RECONCILED','CAS_UPDATE_RECONCILED'],
  ['MAIN_DRIFT_COUNTER_INVALID','INVALID_RETRY_COUNTER']
]);
function read(path){
  return JSON.parse(execFileSync('gh',['api',path],{
    encoding:'utf8',timeout:12000,maxBuffer:5_000_000,stdio:['ignore','pipe','pipe']
  }));
}
function log(path){
  return execFileSync('gh',['api',path],{
    encoding:'utf8',timeout:12000,maxBuffer:2_000_000,stdio:['ignore','pipe','pipe']
  });
}
const date=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:null;};
const percentile=(ns,fraction)=>{
  if(ns.length===0)return null;
  const a=[...ns].sort((x,y)=>x-y);
  return a[Math.ceil(a.length*fraction)-1];
};

// 422 is not proof of a CAS conflict: GitHub uses it for validation and spam protection too.
// Even an independently observed changed head is not causal proof of the HTTP error.
export function classifyCasReadback({httpStatus,expectedHead,observedHead}={}){
  if(httpStatus===422)return SHA.test(expectedHead||'')&&SHA.test(observedHead||'')&&
    expectedHead.toLowerCase()!==observedHead.toLowerCase()
    ?'HTTP_422_AND_HEAD_CHANGED_CAUSALITY_UNVERIFIED':'HTTP_422_CAUSE_UNVERIFIED';
  if(httpStatus===403)return 'HTTP_403_PERMISSION_OR_POLICY';
  if(httpStatus===409)return 'HTTP_409_CONFLICT_UNVERIFIED';
  if(Number.isInteger(httpStatus)&&httpStatus>=500&&httpStatus<600)
    return 'PROVIDER_5XX_UNAVAILABLE';
  return 'NATIVE_UPDATE_REJECTION_CAUSE_UNVERIFIED';
}

// Parse only annotations emitted by the runner, never the logged shell source:
// a command text like echo "::warning::MAIN_DRIFT..." is not a real event.
export function parseSupervisorAnnotations(content,runId){
  if(typeof content!=='string'||content.length>2_000_000)throw Error('LOG_UNBOUNDED');
  const events=[],seen=new Set();
  for(const line of content.split('\n')){
    // Only genuine timestamped annotations OR the exact runtime drift marker.
    // Script source echoes, ANSI text and unstructured prose are never events.
    const m=line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+(.+)$/);
    if(!m)continue;
    const raw=m[1];
    if(raw.includes('\u001b[')||raw.includes('echo "')||raw.includes('printf '))continue;
    const marker=raw.match(/^PR#([1-9]\d{0,9})\s+[a-f0-9]{40}\s+MAIN_DRIFT_RECOVERY$/i);
    const annotation=raw.match(/^##\[(?:warning|notice|error)\](.+)$/);
    if(!marker&&!annotation)continue;
    const note=annotation?.[1]||'';
    let pr=null,code=null;
    if(marker)[code,pr]=['MAIN_DRIFT_RECOVERY',Number(marker[1])];
    else{
      const named=note.match(/^(MAIN_DRIFT_[A-Z_]+):PR#([1-9]\d{0,9})/);
      const rejected=note.match(/^PR#([1-9]\d{0,9}) could not be refreshed automatically;/);
      const successful=note.match(/^PR#([1-9]\d{0,9}) refreshed on same leased lineage /);
      const needed=note.match(/^PR#([1-9]\d{0,9}) requires same-lineage main refresh;/);
      const noLease=note.match(/^PR#([1-9]\d{0,9}) has no exact active terminal writer lease; automatic refresh forbidden\./);
      if(named&&KNOWN.has(named[1]))[code,pr]=[named[1],Number(named[2])];
      else if(rejected)[code,pr]=['NATIVE_UPDATE_REJECTED_CAUSE_UNVERIFIED',Number(rejected[1])];
      else if(successful)[code,pr]=['MAIN_DRIFT_SYNC_CONFIRMED',Number(successful[1])];
      else if(needed)[code,pr]=['MAIN_DRIFT_RECOVERY_ELIGIBLE_UNVERIFIED',Number(needed[1])];
      else if(noLease)[code,pr]=['MAIN_DRIFT_WRITER_LEASE_MISSING',Number(noLease[1])];
    }
    if(code===null||!Number.isSafeInteger(pr))continue;
    const identity=runId+':'+pr+':'+code;
    if(seen.has(identity))continue;
    seen.add(identity);
    const category=code==='MAIN_DRIFT_WRITER_LEASE_MISSING'?'WRITER_LEASE_MISSING':
      code==='MAIN_DRIFT_RECOVERY'?'DRIFT_DETECTED_NOT_PROVEN_RESOLVED':
      KNOWN.get(code)||(code==='NATIVE_UPDATE_REJECTED_CAUSE_UNVERIFIED'?
        'CAS_OR_PROVIDER_REJECTION_UNVERIFIED':
        code==='MAIN_DRIFT_SYNC_CONFIRMED'?'CAS_UPDATE_CONFIRMED':
        'DRIFT_DETECTED_NOT_PROVEN_RESOLVED');
    events.push({run_id:runId,pr_number:pr,code,category});
  }
  return events;
}
export function summarizeSupervisorEvidence({runs=[],events=[],available=0,observedAt,
  repo,readErrors=[]}={}){
  const complete=readErrors.length===0;
  const prMap=new Map(),classes={};
  for(const e of events){
    if(!prMap.has(e.pr_number))prMap.set(e.pr_number,{
      pr_number:e.pr_number,observed_run_ids:new Set(),
      drift_run_ids:new Set(),successful_run_ids:new Set(),rejection_run_ids:new Set(),
      exhausted_run_ids:new Set(),classifications:new Set()
    });
    const p=prMap.get(e.pr_number);
    p.observed_run_ids.add(e.run_id);
    if(e.code==='MAIN_DRIFT_RECOVERY_ELIGIBLE_UNVERIFIED'||
      (e.code.startsWith('MAIN_DRIFT_')&&!['MAIN_DRIFT_SYNC_CONFIRMED','MAIN_DRIFT_SYNC_RECONCILED'].includes(e.code))||
      e.code==='NATIVE_UPDATE_REJECTED_CAUSE_UNVERIFIED')
      p.drift_run_ids.add(e.run_id);
    if(['MAIN_DRIFT_SYNC_CONFIRMED','MAIN_DRIFT_SYNC_RECONCILED'].includes(e.code))
      p.successful_run_ids.add(e.run_id);
    if(e.code==='NATIVE_UPDATE_REJECTED_CAUSE_UNVERIFIED')p.rejection_run_ids.add(e.run_id);
    if(e.code==='MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED')p.exhausted_run_ids.add(e.run_id);
    p.classifications.add(e.category);
    classes[e.category]=(classes[e.category]||0)+1;
  }
  const byPr=[...prMap.values()].map(p=>({
    pr_number:p.pr_number,observed_supervisor_runs:p.observed_run_ids.size,
    drift_observed_in_distinct_runs:p.drift_run_ids.size,
    repeated_drift_observed:p.drift_run_ids.size>=2,
    accepted_or_reconciled_runs:p.successful_run_ids.size,
    native_update_rejection_runs:p.rejection_run_ids.size,
    retry_budget_exhaustion_runs:p.exhausted_run_ids.size,
    categories:[...p.classifications].sort()
  })).sort((a,b)=>b.drift_observed_in_distinct_runs-a.drift_observed_in_distinct_runs||
    a.pr_number-b.pr_number);
  const durations=runs.map(r=>r.supervisor_job_duration_ms).filter(Number.isSafeInteger);
  const timed=complete&&runs.length>=5&&durations.length===runs.length;
  return {
    schema:'powerhouse-supervisor-execution-evidence-v1',observed_at:observedAt,
    repository:repo,source:'GITHUB_ACTIONS_COMPLETED_RUNS_AND_JOB_ANNOTATIONS',
    status:!complete?'PARTIAL_PROVIDER_OBSERVATION':
      runs.length>=5?'SAMPLED_EXECUTION_NOT_RELEASE_SLO':'INSUFFICIENT_EXECUTION_SAMPLES',
    provider_reported_workflow_runs:available,sampled_completed_runs:runs.length,
    sampled_schedule_runs:runs.filter(r=>r.event==='schedule').length,
    sampled_manual_runs:runs.filter(r=>r.event==='workflow_dispatch').length,
    run_sample_limit:6,history_complete:false,
    p50_supervisor_job_duration_ms:timed?percentile(durations,.5):null,
    p95_supervisor_job_duration_ms:timed?percentile(durations,.95):null,
    per_pr:byPr,
    repeated_drift_prs:complete?byPr.filter(p=>p.repeated_drift_observed).map(p=>p.pr_number):null,
    observed_event_categories:classes,
    runs,read_errors:readErrors,
    time_to_green_ms:null,time_to_production_ms:null,
    release_cycle_speedup_proven:false,
    next_action:'COMPARE_PROTECTED_EXACT_SHA_RELEASES_WITH_INDEPENDENT_PRODUCTION_READBACK',
    gate_policy:'UNCHANGED_REQUIRED_CODEQL_PROTECTED_MERGE_PROVIDER_RELEASE',
    can_mutate:false,can_dispatch:false,can_promote:false
  };
}

export function collectSupervisorEvidence({repo=process.env.GITHUB_REPOSITORY,
  now=Date.now(),readApi=read,readLog=log}={}){
  if(!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repo||''))throw Error('REPOSITORY_INVALID');
  const raw=readApi('repos/'+repo+'/actions/workflows/'+WF+'/runs?per_page=40');
  if(!Array.isArray(raw?.workflow_runs)||!Number.isSafeInteger(raw?.total_count)||
    raw.total_count<raw.workflow_runs.length)throw Error('PROVIDER_RUN_LIST_INVALID');
  const selected=raw.workflow_runs.filter(r=>
    Number.isSafeInteger(r?.id)&&r.id>0&&r.status==='completed'&&
    Number.isSafeInteger(r.run_attempt)&&r.run_attempt>0&&
    ['schedule','workflow_dispatch'].includes(r.event)&&SHA.test(r.head_sha||'')&&
    date(r.created_at)!==null&&date(r.created_at)<=now&&date(r.created_at)>=now-7*86400_000
  ).sort((a,b)=>date(b.created_at)-date(a.created_at)).slice(0,6);
  const runs=[],events=[],readErrors=[];
  for(const run of selected){
    try{
      const result=readApi('repos/'+repo+'/actions/runs/'+run.id+'/jobs?per_page=100');
      if(!Array.isArray(result?.jobs)||!Number.isSafeInteger(result?.total_count)||
         result.total_count!==result.jobs.length)throw Error('INCOMPLETE_JOB_LIST');
      const jobs=result.jobs.filter(j=>j.name==='supervise'&&j.status==='completed'&&
        Number.isSafeInteger(j.id));
      if(jobs.length!==1)throw Error('UNVERIFIED_SUPERVISOR_JOB');
      const j=jobs[0],started=date(j.started_at),ended=date(j.completed_at);
      if(started===null||ended===null||ended<started)throw Error('INVALID_JOB_TIMESTAMPS');
      const observed=parseSupervisorAnnotations(
        readLog('repos/'+repo+'/actions/jobs/'+j.id+'/logs'),run.id);
      events.push(...observed);
      runs.push({run_id:run.id,run_attempt:run.run_attempt,event:run.event,
        conclusion:run.conclusion,head_sha:run.head_sha,created_at:run.created_at,
        supervisor_job_duration_ms:ended-started,annotations:observed.length});
    }catch{
      readErrors.push({run_id:run.id,reason:'GITHUB_JOB_OR_LOG_READ_INCOMPLETE'});
      break;
    }
  }
  return summarizeSupervisorEvidence({runs,events,available:raw.total_count,
    observedAt:new Date(now).toISOString(),repo,readErrors});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  let result;
  try{result=collectSupervisorEvidence();}
  catch(error){
    result={schema:'powerhouse-supervisor-execution-evidence-v1',
      status:'PROVIDER_OBSERVATION_UNAVAILABLE',observed_at:new Date().toISOString(),
      reason:String(error?.message||'PROVIDER_READ_FAILED').slice(0,90),
      sampled_completed_runs:0,per_pr:[],read_errors:[{reason:'PROVIDER_READ_FAILED'}],
      time_to_green_ms:null,time_to_production_ms:null,
      release_cycle_speedup_proven:false,can_dispatch:false,can_mutate:false,can_promote:false};
  }
  // Existing Janitor ran CI telemetry earlier this hour; absent/invalid evidence is null.
  let ci=null;
  try{ci=JSON.parse(await readFile('.artifacts/powerhouse-ci-throughput.json','utf8'));}
  catch{ci=null;}
  result.daily_learning=buildSupervisorDailyLearning({supervisor:result,ci});
  await mkdir('.artifacts',{recursive:true});
  await writeFile(OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({status:result.status,runs:result.sampled_completed_runs,
    repeated_drift_prs:result.repeated_drift_prs||[],
    event_categories:result.observed_event_categories||{},release_cycle_speedup_proven:false}));
  if(['PROVIDER_OBSERVATION_UNAVAILABLE','PARTIAL_PROVIDER_OBSERVATION'].includes(result.status))
    process.exitCode=2;
}
