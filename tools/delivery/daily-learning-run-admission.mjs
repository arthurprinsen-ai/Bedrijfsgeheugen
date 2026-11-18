// A single fail-closed daily execution fence used by the EXISTING scheduled workflow.
// A late GitHub schedule may arrive after an earlier manual fallback, so a
// dispatch-only checker cannot by itself guarantee once-per-day execution.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const WORKFLOW='powerhouse-daily-self-evolution.yml';
const EVENTS=new Set(['schedule','workflow_dispatch']);
const REPO=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;

const WORKFLOW_JOBS=new Set(['daily-admission','improve','model-freshness',
  'original-intake-recovery','original-delivery-recovery','original-innovation-code-candidate']);
const SCOPED_RECOVERY_JOBS=new Set(['original-intake-recovery',
  'original-delivery-recovery','original-innovation-code-candidate']);
const isSkipped=job=>job?.status==='completed'&&job.conclusion==='skipped';

// Check actual GitHub JOB evidence, not a successful workflow_run conclusion:
// a "delivery recovery" successfully finishing says nothing about full daily
// learning. Likewise an admission rejected before ANY worker ran is retryable.
export function classifyHistoricalDailyJobs(packet){
  if(!packet||!Number.isSafeInteger(packet.total_count)||
    packet.total_count!==WORKFLOW_JOBS.size||
    !Array.isArray(packet.jobs)||packet.jobs.length!==packet.total_count)
    return 'HOLD_PRIOR_JOB_HISTORY_INCOMPLETE';
  const jobs=new Map();
  for(const job of packet.jobs){
    if(!Number.isSafeInteger(job?.id)||job.id<=0||
       typeof job.name!=='string'||!WORKFLOW_JOBS.has(job.name)||
       jobs.has(job.name)||typeof job.status!=='string')
      return 'HOLD_PRIOR_JOB_HISTORY_INVALID';
    jobs.set(job.name,job);
  }
  if(jobs.size!==WORKFLOW_JOBS.size)return 'HOLD_PRIOR_JOB_HISTORY_INCOMPLETE';
  const daily=jobs.get('daily-admission');
  const ordinary=['improve','model-freshness'].every(name=>isSkipped(jobs.get(name)));
  const scoped=[...SCOPED_RECOVERY_JOBS].filter(name=>!isSkipped(jobs.get(name)));
  if(isSkipped(daily)&&ordinary&&scoped.length===1&&
    [...SCOPED_RECOVERY_JOBS].filter(name=>!scoped.includes(name))
      .every(name=>isSkipped(jobs.get(name))))
    return 'SCOPED_RECOVERY_NOT_A_DAILY_RUN';
  if(daily.status==='completed'&&daily.conclusion==='failure'&&
    [...WORKFLOW_JOBS].filter(name=>name!=='daily-admission')
      .every(name=>isSkipped(jobs.get(name))))
    return 'UNADMITTED_DAILY_NO_SIDE_EFFECTS';
  if(daily.status==='completed'&&daily.conclusion==='skipped')
    return 'HOLD_SCOPED_RUN_IDENTITY_AMBIGUOUS';
  return 'GENUINE_DAILY_ATTEMPT';
}


export function assessDailyRunAdmission({now,runId,event,ref,workflow,snapshot,priorJobReports={}}={}){
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
  const ignored=[];
  for(const earlier of older){
    // A scheduled run is always a candidate daily run; scoped recovery is
    // workflow_dispatch only and MUST be distinguished by native job proof.
    if(earlier.event==='workflow_dispatch' &&
      Object.prototype.hasOwnProperty.call(priorJobReports,earlier.id)){
      const classification=classifyHistoricalDailyJobs(priorJobReports[earlier.id]);
      if(classification.startsWith('HOLD_')){
        return {...base,status:classification,prior_run_id:earlier.id};
      }
      if(classification==='SCOPED_RECOVERY_NOT_A_DAILY_RUN'||
         classification==='UNADMITTED_DAILY_NO_SIDE_EFFECTS'){
        ignored.push({id:earlier.id,reason:classification});
        continue;
      }
    }
    // No job evidence? Fail closed under original canonical behavior:
    // treat the earlier candidate as a daily attempt, never assume a reset.
    return {...base,status:'DUPLICATE_DAILY_RUN_SUPPRESSED',
      prior_run_id:earlier.id,earlier_status:earlier.status,
      earlier_conclusion:earlier.conclusion??null,
      ignored_non_daily_runs:ignored.length};
  }
  return {...base,status:'FIRST_DAILY_RUN_ADMITTED',allow_execution:true,
    ignored_non_daily_runs:ignored.length};
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
  const priorJobReports={};
  if(Array.isArray(snapshot?.workflow_runs) && snapshot.workflow_runs.length<=100 &&
     Number.isSafeInteger(snapshot.total_count)&&
     snapshot.total_count===snapshot.workflow_runs.length){
    const current=snapshot.workflow_runs.find(row=>row?.id===id);
    if(current&&typeof current.created_at==='string'){
      const olderManual=snapshot.workflow_runs.filter(row=>
        row?.head_branch==='main'&&row.event==='workflow_dispatch'&&
        row.created_at?.slice(0,10)===now.slice(0,10)&&row.id!==id&&
        (row.created_at<current.created_at||
         (row.created_at===current.created_at&&row.id<current.id)));
      for(const row of olderManual){
        // The live GitHub Actions /jobs response, not metadata or run title,
        // independently establishes scoped recovery versus genuine daily.
        priorJobReports[row.id]=request('repos/'+repo+'/actions/runs/'+row.id+
          '/jobs?per_page=100');
      }
    }
  }
  return assessDailyRunAdmission({now,runId:id,event:env.GITHUB_EVENT_NAME,
    ref:env.GITHUB_REF,workflow,snapshot,priorJobReports});
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
