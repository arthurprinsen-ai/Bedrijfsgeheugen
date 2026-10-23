// A bounded recovery step in the EXISTING hourly Repository Janitor.
// No scheduler, new tokens/permissions, new queues, status spoofing or retry of failed work.
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export const DAILY_WORKFLOW='powerhouse-daily-self-evolution.yml';
export const DAILY_PATH='.github/workflows/'+DAILY_WORKFLOW;
export const RECOVERY_GRACE_UTC='06:47'; // daily cron 04:47 UTC + two-hour grace
const OUTPUT='.artifacts/powerhouse-daily-learning-liveness.json';
const REPO_PATTERN=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;

function api(repo,suffix){
  return JSON.parse(execFileSync('gh',['api','repos/'+repo+'/actions/workflows/'+DAILY_WORKFLOW+suffix],
    {encoding:'utf8',timeout:12000,maxBuffer:5000000,stdio:['ignore','pipe','pipe']}));
}
function dispatch(repo){
  const value=execFileSync('gh',['api','-X','POST',
    'repos/'+repo+'/actions/workflows/'+DAILY_WORKFLOW+'/dispatches','-f','ref=main'],
    {encoding:'utf8',timeout:12000,maxBuffer:1000000,stdio:['ignore','pipe','pipe']});
  try{return JSON.parse(value);}catch{return {};}
}
function timeValid(value){return typeof value==='string' && Number.isFinite(Date.parse(value));}

export function assessDailyLearningLiveness({now,workflow,snapshot}={}){
  const base={contract:'powerhouse-daily-learning-liveness-v1',status:'UNKNOWN',
    dispatch_allowed:false,scheduled_time_utc:'04:47',grace_until_utc:RECOVERY_GRACE_UTC,
    source:'GITHUB_WORKFLOW_RUNS',existing_run:null,terminal_execution_proven:false};
  if(!timeValid(now)||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now)
    return {...base,status:'INVALID_OBSERVATION_TIME'};
  const day=now.slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))
    return {...base,status:'INVALID_OBSERVATION_TIME'};
  if(workflow?.path!==DAILY_PATH||workflow?.state!=='active')
    return {...base,status:'WORKFLOW_NOT_VERIFIED_ACTIVE'};
  if(!Array.isArray(snapshot?.workflow_runs)||!Number.isSafeInteger(snapshot?.total_count)||
     snapshot.total_count<0||snapshot.total_count<snapshot.workflow_runs.length||
     snapshot.workflow_runs.length>100)
    return {...base,status:'PROVIDER_OBSERVATION_INVALID'};
  // Invalid provider identities cannot be promoted to reliable absence or success.
  if(snapshot.workflow_runs.some(run=>!Number.isSafeInteger(run?.id)||run.id<=0||
      !timeValid(run?.created_at)||typeof run?.event!=='string'||
      typeof run?.head_branch!=='string'||typeof run?.status!=='string'))
    return {...base,status:'PROVIDER_OBSERVATION_INVALID'};
  const observed=snapshot.workflow_runs.filter(run=>run.head_branch==='main' &&
    ['schedule','workflow_dispatch'].includes(run.event) && run.created_at.slice(0,10)===day)
    .sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id-a.id);
  if(observed.length){
    const recent=observed[0];
    return {...base,status:'ALREADY_TRIGGERED_TODAY',existing_run:{
      id:recent.id,event:recent.event,status:recent.status,
      conclusion:recent.conclusion??null,head_sha:recent.head_sha??null,
      created_at:recent.created_at},
      // A provider run existing is not proof of successful daily learning.
      terminal_execution_proven:recent.status==='completed'&&recent.conclusion==='success'};
  }
  // If the first page was truncated, absence is not proven and no dispatch is safe.
  if(snapshot.total_count>snapshot.workflow_runs.length)
    return {...base,status:'PROVIDER_HISTORY_INCOMPLETE'};
  const minutes=Number(now.slice(11,13))*60+Number(now.slice(14,16));
  const grace=6*60+47;
  if(minutes<grace)return {...base,status:'BEFORE_GRACE_WINDOW'};
  // Avoid starting a second day's work just before the next day and keep recovery bounded.
  if(minutes>=23*60)return {...base,status:'WINDOW_EXPIRED_MANUAL_REVIEW'};
  return {...base,status:'MISSED_SCHEDULE_VERIFIED',dispatch_allowed:true};
}

export async function recoverDailyLearning({repo=process.env.GITHUB_REPOSITORY,
  now=new Date().toISOString(),ref=process.env.GITHUB_REF,
  event=process.env.GITHUB_EVENT_NAME,mode=process.env.REQUESTED_MODE,
  read=api,send=dispatch}={}){
  if(!REPO_PATTERN.test(repo||''))throw Error('DAILY_LEARNING_REPOSITORY_INVALID');
  const authorized=ref==='refs/heads/main' && (event==='schedule'||
    (event==='workflow_dispatch'&&mode==='apply-safe'));
  if(!authorized)return {...assessDailyLearningLiveness({now}),
    status:'NON_OWNER_OR_READ_ONLY_MODE',dispatch_allowed:false,
    dispatch_requested:false,execution_verified:false,provider_reads:0};
  const uri='/runs?per_page=100';
  const workflow=read(repo,'');
  let reads=1;
  const first=assessDailyLearningLiveness({now,workflow,snapshot:read(repo,uri)});
  reads++;
  if(!first.dispatch_allowed)
    return {...first,dispatch_requested:false,execution_verified:false,provider_reads:reads};
  // Race fence: another owner/manual or scheduled run appearing before dispatch wins.
  const second=assessDailyLearningLiveness({now,workflow,snapshot:read(repo,uri)});
  reads++;
  if(!second.dispatch_allowed)
    return {...second,status:'RECOVERY_SUPPRESSED_AFTER_RECHECK',
      previous_status:second.status,dispatch_requested:false,
      execution_verified:false,provider_reads:reads};
  const result=send(repo);
  return {...second,status:'RECOVERY_DISPATCH_ACCEPTED_NOT_EXECUTION_PROOF',
    dispatch_allowed:false,dispatch_requested:true,execution_verified:false,
    provider_reads:reads,workflow_run_id:Number.isSafeInteger(result?.workflow_run_id)?
      result.workflow_run_id:null};
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  let proof;
  try{proof=await recoverDailyLearning();
    proof={...proof,observed_at:new Date().toISOString(),
      repository:process.env.GITHUB_REPOSITORY,
      no_new_scheduler:true,no_new_writer:true,mandatory_gates_unchanged:true};
  }catch(error){
    proof={contract:'powerhouse-daily-learning-liveness-v1',
      status:'PROVIDER_RECOVERY_UNAVAILABLE',observed_at:new Date().toISOString(),
      dispatch_requested:false,execution_verified:false,mandatory_gates_unchanged:true,
      reason:String(error?.message||'UNKNOWN').slice(0,120)};
    process.exitCode=2;
  }
  await mkdir('.artifacts',{recursive:true});
  await writeFile(OUTPUT,JSON.stringify(proof,null,2)+'\n');
  console.log(JSON.stringify({status:proof.status,dispatch_requested:proof.dispatch_requested,
    execution_verified:proof.execution_verified,provider_reads:proof.provider_reads??null,
    workflow_run_id:proof.workflow_run_id??null}));
}
