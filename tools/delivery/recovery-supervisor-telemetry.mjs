// Read-only evidence projection for the EXISTING hourly Repository Janitor.
// No new scheduler, writer, status mutation, or interpretation of run success as PR recovery.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RECOVERY_TELEMETRY_VERSION='POWERHOUSE-SUPERVISOR-OBSERVATION-v1';
export const MAX_OBSERVED_RUNS=2;
export const MAX_AGE_MS=7*24*60*60*1000;
export const OUTPUT='.artifacts/powerhouse-supervisor-drift-observation.json';
const SUPERVISOR='powerhouse-delivery-recovery-supervisor.yml';
const EVENTS=Object.freeze({
  drift:'MAIN_DRIFT_RECOVERY',
  lease_missing:'has no exact active terminal writer lease',
  sync_reconciled:'MAIN_DRIFT_SYNC_RECONCILED',
  sync_timeout:'MAIN_DRIFT_SYNC_TIMED_OUT',
  sync_pending:'MAIN_DRIFT_SYNC_PENDING',
  async_pending:'MAIN_DRIFT_ASYNC_PENDING',
  update_unverified:'MAIN_DRIFT_UPDATE_UNVERIFIED',
  budget_exhausted:'MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED',
  sync_race:'MAIN_DRIFT_SYNC_RACE',
  sync_rejected:'could not be refreshed automatically',
  queue_circuit_open:'ACTIONS_QUEUE_CIRCUIT_OPEN',
  budget_used:'RECOVERY_PR_BUDGET_USED'
});

function apiRead(endpoint){
  return execFileSync('gh',['api',endpoint],{encoding:'utf8',timeout:16000,maxBuffer:5_000_000,stdio:['ignore','pipe','pipe']});
}
function jsonRead(endpoint){return JSON.parse(apiRead(endpoint));}
function validId(id){return Number.isSafeInteger(id)&&id>0;}
function eventRecord(line){
  // Only runtime timestamps + emitted event messages. Never count shell source
  // that GitHub prints with ANSI "Run" echoes near the beginning of a step.
  const timestamp=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+/.exec(line);
  if(!timestamp)return null;
  const raw=line.slice(timestamp[0].length);
  if(raw.includes('\u001b[')||raw.includes('echo "')||raw.includes('printf '))return null;
  return raw.replace(/^##\[(?:notice|warning|error)\]/,'').trim();
}
export function parseSupervisorRunLog(log){
  if(typeof log!=='string'||log.length>5_000_000)throw Error('SUPERVISOR_LOG_UNAVAILABLE_OR_OVERSIZE');
  const counts=Object.fromEntries(Object.keys(EVENTS).map(k=>[k,0]));
  const driftPrs=new Set(),missingLeasePrs=new Set(),reconciledPrs=new Set();
  const marker=/^PR#(\d+)\s+[0-9a-f]{40}\s+MAIN_DRIFT_RECOVERY$/;
  let runtimeLines=0;
  for(const line of log.split('\n')){
    const msg=eventRecord(line);
    if(!msg)continue;
    runtimeLines++;
    const m=marker.exec(msg);
    if(m){counts.drift++;driftPrs.add(Number(m[1]));continue;}
    let x;
    if((x=/^PR#(\d+) has no exact active terminal writer lease; automatic refresh forbidden\.$/.exec(msg))){
      counts.lease_missing++;missingLeasePrs.add(Number(x[1]));continue;
    }
    if((x=/^MAIN_DRIFT_SYNC_RECONCILED:PR#(\d+)/.exec(msg))){
      counts.sync_reconciled++;reconciledPrs.add(Number(x[1]));continue;
    }
    if(/^MAIN_DRIFT_SYNC_TIMED_OUT:PR#\d+/.test(msg)){counts.sync_timeout++;continue;}
    if(/^MAIN_DRIFT_SYNC_PENDING:PR#\d+/.test(msg)){counts.sync_pending++;continue;}
    if(/^MAIN_DRIFT_ASYNC_PENDING:PR#\d+/.test(msg)){counts.async_pending++;continue;}
    if(/^MAIN_DRIFT_UPDATE_UNVERIFIED:PR#\d+/.test(msg)){counts.update_unverified++;continue;}
    if(/^MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED:PR#\d+/.test(msg)){counts.budget_exhausted++;continue;}
    if(/^MAIN_DRIFT_SYNC_RACE:PR#\d+/.test(msg)){counts.sync_race++;continue;}
    if(/^PR#\d+ could not be refreshed automatically; restoring terminal lease fail-closed\.$/.test(msg)){counts.sync_rejected++;continue;}
    if(/^ACTIONS_QUEUE_CIRCUIT_OPEN:/.test(msg)){counts.queue_circuit_open++;continue;}
    if(/^RECOVERY_PR_BUDGET_USED:\d+\/\d+$/.test(msg)){counts.budget_used++;continue;}
  }
  if(!runtimeLines)throw Error('SUPERVISOR_LOG_HAS_NO_PROVIDER_TIMESTAMPED_LINES');
  return {
    counts,
    drift_pr_numbers:[...driftPrs].sort((a,b)=>a-b),
    lease_missing_pr_numbers:[...missingLeasePrs].sort((a,b)=>a-b),
    reconciled_pr_numbers:[...reconciledPrs].sort((a,b)=>a-b),
    // GitHub's 202 is only accepted; no native CAS-rejection count is claimed
    // without an independently emitted typed provider response.
    stale_head_422_count:null,
    actual_branch_mutation_proven:false,
    verified_customer_outcome:false
  };
}
export function summarizeSupervisorObservations(rows,errors=[]){
  if(!Array.isArray(rows)||!Array.isArray(errors))throw Error('SUPERVISOR_EVIDENCE_INVALID');
  const byPr=new Map();
  for(const row of rows){
    if(!validId(row.run_id)||!Array.isArray(row.drift_pr_numbers))throw Error('SUPERVISOR_RUN_ID_OR_DRIFT_SAMPLE_INVALID');
    for(const number of new Set(row.drift_pr_numbers)){
      if(!validId(number))throw Error('SUPERVISOR_PR_NUMBER_INVALID');
      const runs=byPr.get(number)||new Set();
      runs.add(row.run_id);byPr.set(number,runs);
    }
  }
  const repeated=[...byPr.entries()].filter(([,runs])=>runs.size>=2).map(([number])=>number).sort((a,b)=>a-b);
  return {
    version:RECOVERY_TELEMETRY_VERSION,
    status:errors.length?'PARTIAL_PROVIDER_EVIDENCE':rows.length?'OBSERVED_BOUNDED_SAMPLE':'NO_COMPLETED_RUN_IN_WINDOW',
    scope:'latest_two_completed_supervisor_runs_within_seven_days',
    runs_checked:rows.length,
    runs:rows,
    repeated_drift_pr_numbers:errors.length?null:repeated,
    repeated_drift_pr_count:errors.length?null:repeated.length,
    errors,
    provider_proof_kind:'github_actions_supervisor_job_logs',
    verification_boundary:'run_success_not_equal_pr_recovery_or_cas_acceptance_or_customer_value',
    creates_scheduler:false,
    mutates_branches:false
  };
}
export async function collectSupervisorDriftObservation({repo=process.env.GITHUB_REPOSITORY,now=Date.now(),readJson=jsonRead,readText=apiRead}={}){
  if(!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repo||''))throw Error('SUPERVISOR_REPO_INVALID');
  const endpoint='repos/'+repo+'/actions/workflows/'+SUPERVISOR+'/runs?per_page=12';
  const list=readJson(endpoint);
  if(!Array.isArray(list?.workflow_runs))throw Error('SUPERVISOR_RUN_LIST_PROVIDER_SHAPE_INVALID');
  const eligible=list.workflow_runs.filter(r=>validId(r?.id)&&r.status==='completed'&&
    Number.isFinite(Date.parse(r.created_at))&&Date.parse(r.created_at)>=now-MAX_AGE_MS)
    .slice(0,MAX_OBSERVED_RUNS);
  const rows=[],errors=[];
  for(const run of eligible){
    try{
      const jobs=readJson('repos/'+repo+'/actions/runs/'+run.id+'/jobs?per_page=20');
      if(!Array.isArray(jobs?.jobs)||!Number.isSafeInteger(jobs.total_count)||jobs.total_count>jobs.jobs.length)
        throw Error('SUPERVISOR_JOB_LIST_INCOMPLETE');
      const job=jobs.jobs.find(j=>j.name==='supervise'&&validId(j.id));
      if(!job||job.status!=='completed')throw Error('SUPERVISOR_JOB_NOT_COMPLETED');
      const log=readText('repos/'+repo+'/actions/jobs/'+job.id+'/logs');
      const observed=parseSupervisorRunLog(log);
      rows.push({run_id:run.id,job_id:job.id,head_sha:run.head_sha||null,
        event:run.event||null,created_at:run.created_at,
        run_conclusion:run.conclusion||null,job_conclusion:job.conclusion||null,...observed});
    }catch(error){
      errors.push({run_id:run.id,reason:'SUPERVISOR_PROVIDER_READ_FAILED',detail:String(error?.message||error).slice(0,160)});
      break; // fail closed: never convert missing logs into zero observed drift
    }
  }
  return summarizeSupervisorObservations(rows,errors);
}

const isCli=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCli){
  let result;
  try{result=await collectSupervisorDriftObservation();}
  catch(error){
    result={version:RECOVERY_TELEMETRY_VERSION,status:'PROVIDER_EVIDENCE_UNAVAILABLE',
      errors:[{reason:String(error?.message||error).slice(0,160)}],
      repeated_drift_pr_count:null,verification_boundary:'no_fabricated_zero_or_green'};
  }
  await mkdir('.artifacts',{recursive:true});
  await writeFile(OUTPUT,JSON.stringify({...result,observed_at:new Date().toISOString()},null,2)+'\n');
  console.log('SUPERVISOR_DRIFT_OBSERVATION:'+JSON.stringify({status:result.status,
    runs_checked:result.runs_checked??0,repeated_drift_pr_count:result.repeated_drift_pr_count??null}));
}
