// A single fail-closed daily execution fence used by the EXISTING scheduled workflow.
// A late GitHub schedule may arrive after an earlier manual fallback, so a
// dispatch-only checker cannot by itself guarantee once-per-day execution.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const WORKFLOW='powerhouse-daily-self-evolution.yml';
const EVENTS=new Set(['schedule','workflow_dispatch']);
const REPO=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;

export function assessDailyRunAdmission({now,runId,event,ref,workflow,snapshot}={}){
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
  if(older.length){
    return {...base,status:'DUPLICATE_DAILY_RUN_SUPPRESSED',prior_run_id:older[0].id,
      earlier_status:older[0].status,earlier_conclusion:older[0].conclusion??null};
  }
  return {...base,status:'FIRST_DAILY_RUN_ADMITTED',allow_execution:true};
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
  return assessDailyRunAdmission({now,runId:id,event:env.GITHUB_EVENT_NAME,
    ref:env.GITHUB_REF,workflow,snapshot});
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
