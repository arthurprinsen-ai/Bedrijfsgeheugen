// A single fail-closed daily execution fence used by the EXISTING scheduled workflow.
// A late GitHub schedule may arrive after an earlier manual fallback, so a
// dispatch-only checker cannot by itself guarantee once-per-day execution.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const WORKFLOW='powerhouse-daily-self-evolution.yml';
const EVENTS=new Set(['schedule','workflow_dispatch']);
const REPO=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;


/**
 * A limited recovery run is never a daily learning execution. GitHub Actions
 * workflow_runs do not reliably include workflow_dispatch input values, so
 * require independent native GitHub JOB evidence to prove that the daily
 * admission and both normal daily jobs were SKIPPED and that exactly one
 * original recovery path ran. Missing/truncated/racing provider evidence is
 * treated as an earlier full daily candidate (fail closed).
 */
const ORIGINAL_RECOVERY_JOBS=Object.freeze([
  'original-intake-recovery',
  'original-innovation-code-candidate',
  'original-delivery-recovery'
]);
const ORIGINAL_DAILY_JOBS=Object.freeze([
  'daily-admission','improve','model-freshness'
]);
const ALL_EXPECTED_JOBS=new Set([...ORIGINAL_RECOVERY_JOBS,...ORIGINAL_DAILY_JOBS]);

export function isProvenScopedRecoveryRun(run,jobsReadback){
  if(run?.event!=='workflow_dispatch'||run?.head_branch!=='main'||
    !jobsReadback||!Number.isSafeInteger(jobsReadback.total_count)||
    jobsReadback.total_count!==ALL_EXPECTED_JOBS.size||
    !Array.isArray(jobsReadback.jobs)||
    jobsReadback.jobs.length!==jobsReadback.total_count)return false;
  const byName=new Map();
  for(const job of jobsReadback.jobs){
    if(typeof job?.name!=='string'||!ALL_EXPECTED_JOBS.has(job.name)||
      byName.has(job.name)||typeof job?.status!=='string')return false;
    byName.set(job.name,job);
  }
  if(byName.size!==ALL_EXPECTED_JOBS.size)return false;
  if(ORIGINAL_DAILY_JOBS.some(name=>{
    const job=byName.get(name);
    return job?.status!=='completed'||job?.conclusion!=='skipped';
  }))return false;
  const scoped=ORIGINAL_RECOVERY_JOBS.filter(name=>{
    const job=byName.get(name);
    return job?.conclusion!=='skipped'&&
      ((job?.status==='completed'&&['success','failure','cancelled','timed_out','neutral'].includes(job?.conclusion))||
       (['queued','in_progress','waiting'].includes(job?.status)&&job?.conclusion==null));
  });
  if(scoped.length!==1)return false;
  return ORIGINAL_RECOVERY_JOBS.filter(name=>!scoped.includes(name)).every(name=>{
    const job=byName.get(name);
    return job?.status==='completed'&&job?.conclusion==='skipped';
  });
}


/**
 * One bounded retry is safe ONLY when native GitHub proves that the previous
 * full daily run failed at read-only daily-admission BEFORE any improve,
 * Engineering code candidate, model-freshness or recovery execution began.
 * A previously admitted (even later failed) true daily must still block.
 * Unproven or repeated aborts remain blocking to prevent retry storms.
 */
export function isProvenPreExecutionAdmissionAbort(run,jobsReadback){
  if(!EVENTS.has(run?.event)||run?.head_branch!=='main'||
    run?.status!=='completed'||run?.conclusion!=='failure'||
    !jobsReadback||jobsReadback.total_count!==ALL_EXPECTED_JOBS.size||
    !Array.isArray(jobsReadback.jobs)||
    jobsReadback.jobs.length!==ALL_EXPECTED_JOBS.size)return false;
  const byName=new Map();
  for(const job of jobsReadback.jobs){
    if(!ALL_EXPECTED_JOBS.has(job?.name)||byName.has(job.name)||
      typeof job.status!=='string')return false;
    byName.set(job.name,job);
  }
  if(byName.size!==ALL_EXPECTED_JOBS.size)return false;
  const admission=byName.get('daily-admission');
  if(admission.status!=='completed'||admission.conclusion!=='failure')return false;
  return [...ORIGINAL_RECOVERY_JOBS,'improve','model-freshness'].every(name=>{
    const job=byName.get(name);
    return job?.status==='completed'&&job?.conclusion==='skipped';
  });
}

export function assessDailyRunAdmission({now,runId,event,ref,workflow,snapshot,priorJobsByRunId={}}={}){
  const base={contract:'powerhouse-daily-run-admission-v1',status:'HOLD_INVALID_PROVIDER_EVIDENCE',
    allow_execution:false,prior_run_id:null,proof:'NOT_TERMINAL_JOB_SUCCESS'};
  if(typeof now!=='string'||!Number.isFinite(Date.parse(now))||
      new Date(now).toISOString()!==now||
      !Number.isSafeInteger(runId)||runId<=0||
      !EVENTS.has(event)||ref!=='refs/heads/main')
    return {...base,status:'HOLD_UNTRUSTED_RUN_CONTEXT'};
  if(workflow?.state!=='active'||workflow?.path!=='.github/workflows/'+WORKFLOW)
    return {...base,status:'HOLD_WORKFLOW_NOT_VERIFIED_ACTIVE'};
  if(!Array.isArray(snapshot?.workflow_runs)||
     !Number.isSafeInteger(snapshot?.total_count)||
     snapshot.total_count!==snapshot.workflow_runs.length||
     snapshot.workflow_runs.length>100)
    return {...base,status:'HOLD_PROVIDER_HISTORY_INCOMPLETE'};
  const day=now.slice(0,10);
  const rows=snapshot.workflow_runs;
  if(rows.some(x=>!Number.isSafeInteger(x?.id)||x.id<=0||
      typeof x.created_at!=='string'||!Number.isFinite(Date.parse(x.created_at))||
      typeof x.event!=='string'||typeof x.head_branch!=='string'||
      typeof x.status!=='string'))
    return {...base,status:'HOLD_PROVIDER_HISTORY_INVALID'};
  const eligible=rows.filter(x=>x.head_branch==='main'&&EVENTS.has(x.event)&&
    x.created_at.slice(0,10)===day);
  const current=eligible.find(x=>x.id===runId);
  if(!current)return {...base,status:'HOLD_CURRENT_RUN_MISSING_FROM_PROVIDER'};
  if(current.event!==event)return {...base,status:'HOLD_CURRENT_RUN_CONTEXT_MISMATCH'};
  const older=eligible.filter(x=>x.id!==runId &&
    (x.created_at<current.created_at ||
    (x.created_at===current.created_at&&x.id<current.id)))
    .sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id-b.id);
  // A recovery-only run has no normal learning/admission jobs, regardless
  // of its overall success or failure. Do not let it consume today's ONE
  // allowed genuine daily execution. Unknown job proofs remain blocking.
  const scopedRecoveries=older.filter(row=>
    isProvenScopedRecoveryRun(row,priorJobsByRunId?.[row.id]));
  const preExecutionAborts=older.filter(row=>
    isProvenPreExecutionAdmissionAbort(row,priorJobsByRunId?.[row.id]));
  const earlierDaily=older.filter(row=>
    !scopedRecoveries.some(s=>s.id===row.id)&&
    !preExecutionAborts.some(a=>a.id===row.id));
  if(earlierDaily.length){
    return {...base,status:'DUPLICATE_DAILY_RUN_SUPPRESSED',
      prior_run_id:earlierDaily[0].id,
      earlier_status:earlierDaily[0].status,
      earlier_conclusion:earlierDaily[0].conclusion??null,
      scoped_recoveries_excluded:scopedRecoveries.length,
      pre_execution_aborts_verified:preExecutionAborts.length};
  }
  if(preExecutionAborts.length>1){
    return {...base,status:'PRE_EXECUTION_RETRY_BUDGET_EXCEEDED',
      prior_run_id:preExecutionAborts[0].id,
      scoped_recoveries_excluded:scopedRecoveries.length,
      pre_execution_aborts_verified:preExecutionAborts.length};
  }
  return {...base,status:'FIRST_DAILY_RUN_ADMITTED',allow_execution:true,
    scoped_recoveries_excluded:scopedRecoveries.length,
    pre_execution_aborts_verified:preExecutionAborts.length};
}

export function evaluateProviderDailyRun({
  env=process.env,now=new Date().toISOString(),request
}={}){
  const repo=env.GITHUB_REPOSITORY;
  const id=Number(env.GITHUB_RUN_ID);
  if(!REPO.test(repo||''))throw Error('DAILY_RUN_REPOSITORY_INVALID');
  if(typeof request!=='function')throw Error('GITHUB_PROVIDER_ADAPTER_REQUIRED');
  const workflow=request('repos/'+repo+'/actions/workflows/'+WORKFLOW);
  // Day-scoped history: an incomplete first page is NOT reliable absence.
  const snapshot=request('repos/'+repo+'/actions/workflows/'+WORKFLOW+
    '/runs?branch=main&created='+now.slice(0,10)+'&per_page=100');
  const priorJobsByRunId={};
  // All earlier run jobs are native provider evidence: a scoped recovery
  // can be manual only, but an admission-only aborted daily can be manual
  // OR scheduled. Both exclusions require independent exact job receipts.
  for(const row of Array.isArray(snapshot?.workflow_runs)?snapshot.workflow_runs:[]){
    if(row?.id===id||!EVENTS.has(row?.event)||
      row?.head_branch!=='main'||row?.created_at?.slice(0,10)!==now.slice(0,10))
      continue;
    const thisRun=snapshot.workflow_runs.find(x=>x.id===id);
    if(!thisRun||!(row.created_at<thisRun.created_at||
      (row.created_at===thisRun.created_at&&row.id<id)))continue;
    priorJobsByRunId[row.id]=request('repos/'+repo+'/actions/runs/'+row.id+'/jobs?per_page=100');
  }
  return assessDailyRunAdmission({now,runId:id,event:env.GITHUB_EVENT_NAME,
    ref:env.GITHUB_REF,workflow,snapshot,priorJobsByRunId});
}

function gh(endpoint){
  const result=execFileSync('gh',['api',endpoint],{encoding:'utf8',timeout:15000,
    maxBuffer:5000000,stdio:['ignore','pipe','pipe']});
  return JSON.parse(result);
}

if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  let verdict;
  try{
    verdict=evaluateProviderDailyRun({request:gh});
  }catch(error){
    verdict={contract:'powerhouse-daily-run-admission-v1',
      status:'HOLD_PROVIDER_READ_ERROR',allow_execution:false,
      reason:String(error?.message||'UNKNOWN').slice(0,120)};
  }
  console.log(JSON.stringify({...verdict,run_id:process.env.GITHUB_RUN_ID,
    no_new_scheduler:true,model_freshness_evidence_required:true}));
  // Fail visibly, BEFORE any daily learning or model freshness job,
  // rather than report a skipped duplicate as a successful learner.
  if(!verdict.allow_execution)process.exitCode=78;
}
