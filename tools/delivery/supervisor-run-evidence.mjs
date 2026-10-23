// Read-only executed Recovery Supervisor evidence, reused by the original hourly Janitor.
// This module cannot synchronize branches, dispatch workflows or assert production readiness.
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const SHA=/^[0-9a-f]{40}$/i;
const DATE=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const EVENTS=new Set(['schedule','workflow_dispatch']);
const CLASSES=Object.freeze({
  MAIN_DRIFT_SYNC_RECONCILED:'RECONCILED',
  MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED:'BOUNDED',
  MAIN_DRIFT_SYNC_TIMED_OUT:'TIMED_OUT',
  MAIN_DRIFT_SYNC_RACE:'STALE_WRITE',
  MAIN_DRIFT_CAS_REJECTED_422:'CAS_HEAD_MISMATCH',
  MAIN_DRIFT_CAS_REJECTED_403:'CAS_PERMISSION'
});
function validDate(v){return typeof v==='string'&&DATE.test(v)&&Number.isFinite(Date.parse(v));}
function actualLines(log){
  return log.split(/\r?\n/).filter(l=>!l.includes('\x1b')).map(l=>{
    const m=l.match(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z\s+(.+)$/);
    return m?m[1]:null;
  }).filter(Boolean).map(l=>l.replace(/^##\[(?:notice|warning|error)\]/,''));
}
export function classifySupervisorRun({run,job,log,complete=false}={}){
  if(!run||!job||!complete||typeof log!=='string'||!Number.isSafeInteger(run.id)||
    run.id<=0||!Number.isSafeInteger(job.id)||job.id<=0||
    run.name!=='Powerhouse Delivery Recovery Supervisor'||!EVENTS.has(run.event)||
    run.status!=='completed'||!['success','failure','cancelled','timed_out'].includes(run.conclusion)||
    job.name!=='supervise'||job.status!=='completed'||!['success','failure','cancelled','timed_out'].includes(job.conclusion)||
    !SHA.test(run.head_sha||'')||!validDate(run.created_at)){
    return {status:'INVALID_PROVIDER_PROOF'};
  }
  const events=[],seen=new Set();
  for(const line of actualLines(log)){
    const drift=line.match(/^PR#(\d+) ([0-9a-f]{40}) (MAIN_DRIFT_RECOVERY|MERGE_CONFLICT_RECOVERY)$/);
    const lease=line.match(/^PR#(\d+) has no exact active terminal writer lease; automatic refresh forbidden\.$/);
    const typed=line.match(/^(MAIN_DRIFT_[A-Z0-9_]+):PR#(\d+)(?:\b|[ ,;])/);
    const pr=Number(drift?.[1]||lease?.[1]||typed?.[2]);
    if(!Number.isSafeInteger(pr)||pr<=0)continue;
    const kind=drift?.[3]||(lease?'LEASE_NOT_TERMINAL':typed?.[1]);
    if(!drift&&!lease&&!CLASSES[kind])continue; // A generic "HTTP 422" is not CAS evidence.
    const id=[pr,kind,drift?.[2]||''].join('|');
    if(seen.has(id))continue;
    seen.add(id);
    events.push({pr,kind,...(drift?{headSha:drift[2]}:{}),
      ...(lease?{classification:'OWNER_HANDOFF_REQUIRED'}:
        CLASSES[kind]?{classification:CLASSES[kind]}:{})});
  }
  return {status:'EXECUTED_PROOF',runId:run.id,trigger:run.event,events};
}
export function summarizeSupervisorRuns(observations=[]){
  if(!Array.isArray(observations))throw Error('INVALID_SUPERVISOR_INPUT');
  const results=observations.map(classifySupervisorRun),seen=new Set(),duplicate=new Set(),valid=[];
  for(const x of results){
    if(x.status!=='EXECUTED_PROOF')continue;
    if(seen.has(x.runId)){duplicate.add(x.runId);continue;}
    seen.add(x.runId);valid.push(x);
  }
  const perPr=new Map();
  for(const x of valid.filter(x=>!duplicate.has(x.runId)))for(const e of x.events){
    if(!perPr.has(e.pr))perPr.set(e.pr,{pr:e.pr,runIds:new Set(),driftRunIds:new Set(),outcomes:{}});
    const p=perPr.get(e.pr);
    p.runIds.add(x.runId);
    if(e.kind==='MAIN_DRIFT_RECOVERY'||e.kind==='MERGE_CONFLICT_RECOVERY')p.driftRunIds.add(x.runId);
    if(e.classification)p.outcomes[e.classification]=(p.outcomes[e.classification]||0)+1;
  }
  const prs=[...perPr.values()].sort((a,b)=>a.pr-b.pr).map(p=>({
    pr:p.pr,executedRuns:p.runIds.size,independentDriftRuns:p.driftRunIds.size,
    repeatedDrift:p.driftRunIds.size>=2,outcomes:p.outcomes
  }));
  const complete=results.every(x=>x.status==='EXECUTED_PROOF')&&duplicate.size===0;
  return {schema:'powerhouse-supervisor-run-evidence-v1',
    status:!complete?'INCOMPLETE_PROVIDER_PROOF':valid.length>=3?'OBSERVED_SAMPLE':'INSUFFICIENT_EXECUTED_RUNS',
    completedRuns:valid.length,scheduledRuns:valid.filter(x=>x.trigger==='schedule').length,
    manualRuns:valid.filter(x=>x.trigger==='workflow_dispatch').length,
    repeatedDriftPrs:prs.filter(p=>p.repeatedDrift).length,
    explicitlyProvenCasRejections:prs.reduce((n,p)=>n+(p.outcomes.CAS_HEAD_MISMATCH||0)+(p.outcomes.CAS_PERMISSION||0),0),
    prs,p50GreenToProductionMs:null,p95GreenToProductionMs:null,
    automatedWritesAllowed:false,performanceImprovementProven:false};
}
function json(path){return JSON.parse(execFileSync('gh',['api',path],{encoding:'utf8',timeout:12000,maxBuffer:3500000}));}
function plain(path){return execFileSync('gh',['api',path],{encoding:'utf8',timeout:12000,maxBuffer:5000000});}
export async function observeSupervisorRuns({repo=process.env.GITHUB_REPOSITORY,now=Date.now(),getJson=json,getText=plain}={}){
  if(!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repo||''))throw Error('SUPERVISOR_REPO_INVALID');
  const rows=[],limit=5;
  try{
    const set=getJson('repos/'+repo+'/actions/workflows/powerhouse-delivery-recovery-supervisor.yml/runs?per_page=30');
    if(!Array.isArray(set?.workflow_runs))throw Error('SUPERVISOR_RUN_LIST_INVALID');
    const runs=set.workflow_runs.filter(x=>x.status==='completed'&&validDate(x.created_at)&&
      Date.parse(x.created_at)>=now-7*86400000).slice(0,limit);
    for(const run of runs){
      const jobs=getJson('repos/'+repo+'/actions/runs/'+run.id+'/jobs?per_page=100');
      if(!Array.isArray(jobs?.jobs)||!Number.isSafeInteger(jobs.total_count)||
        jobs.total_count>jobs.jobs.length)throw Error('SUPERVISOR_JOB_PAGE_INCOMPLETE');
      const subset=jobs.jobs.filter(x=>x.name==='supervise');
      if(subset.length!==1)throw Error('SUPERVISOR_JOB_IDENTITY_MISSING');
      const job=subset[0];
      const log=getText('repos/'+repo+'/actions/jobs/'+job.id+'/logs');
      rows.push({run,job,log,complete:true});
    }
    return {...summarizeSupervisorRuns(rows),repository:repo,observedAt:new Date(now).toISOString(),
      providerReadComplete:true,maxRunReads:limit};
  }catch{
    return {...summarizeSupervisorRuns(rows),repository:repo,observedAt:new Date(now).toISOString(),
      status:'INCOMPLETE_PROVIDER_PROOF',providerReadComplete:false,maxRunReads:limit};
  }
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const evidence=await observeSupervisorRuns();
  await mkdir('.artifacts',{recursive:true});
  await writeFile('.artifacts/powerhouse-supervisor-runs.json',JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify({status:evidence.status,completedRuns:evidence.completedRuns,
    scheduledRuns:evidence.scheduledRuns,manualRuns:evidence.manualRuns,
    repeatedDriftPrs:evidence.repeatedDriftPrs,providerReadComplete:evidence.providerReadComplete}));
  if(!evidence.providerReadComplete)process.exitCode=2;
}
