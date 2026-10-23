// Existing hourly Powerhouse Repository Janitor's READ-ONLY GitHub CI observation.
// 1 completed-runs GET and at most 24 job-list GETs; stop on the first provider error. No new scheduler, dispatch,
// check/run mutation, provider-ghost classification or "green" state write.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { summarizeObservedCiJobs } from './predictive-controller.mjs';
import { routeObservedCiHotspots } from './ci-agent-priority.mjs';

const MAX_RUNS=24;
const MAX_AGE_MS=7*24*60*60*1000;
const OUT='.artifacts/powerhouse-ci-throughput.json';
function readJson(path){
  const output=execFileSync('gh',['api',path],{
    encoding:'utf8',timeout:12000,maxBuffer:5_000_000,
    stdio:['ignore','pipe','pipe']
  });
  return JSON.parse(output);
}

export async function collectObservedCiThroughput({repo=process.env.GITHUB_REPOSITORY,now=Date.now(),read=readJson}={}){
  if(!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repo||''))throw new Error('CI_THROUGHPUT_REPOSITORY_MISSING');
  const records=read('repos/'+repo+'/actions/runs?status=completed&per_page=40');
  if(!Array.isArray(records?.workflow_runs))throw new Error('CI_THROUGHPUT_PROVIDER_LIST_INVALID');
  const cutoff=now-MAX_AGE_MS;
  const selected=records.workflow_runs.filter(run=>
    run?.status==='completed' &&
    Number.isSafeInteger(run?.id) &&
    Number.isSafeInteger(run?.run_attempt) && run.run_attempt>0 &&
    /^[0-9a-f]{40}$/i.test(run?.head_sha||'') &&
    Number.isFinite(Date.parse(run?.created_at||'')) &&
    Date.parse(run.created_at)>=cutoff
  ).slice(0,MAX_RUNS);

  const observations=[],readErrors=[];
  let sampledRuns=0;
  for(const run of selected){
    sampledRuns++;
    try{
      const result=read('repos/'+repo+'/actions/runs/'+run.id+'/jobs?per_page=100');
      if(!Array.isArray(result?.jobs)||!Number.isSafeInteger(result?.total_count)||
         result.total_count>result.jobs.length){
        readErrors.push({run_id:run.id,reason:'JOBS_SNAPSHOT_INCOMPLETE'});break;
      }
      for(const job of result.jobs)observations.push({run,job});
      // Stop on independently sufficient evidence. Never hide an earlier read error.
      if(readErrors.length===0 && summarizeObservedCiJobs(observations).status==='SAMPLED_METRICS_NOT_SLO')break;
    }catch{
      readErrors.push({run_id:run.id,reason:'GITHUB_JOB_READ_UNAVAILABLE'});
      break;
    }
  }
  const summary=summarizeObservedCiJobs(observations);
  const incomplete=readErrors.length>0;
  const result={
    ...summary,
    // A provider error suppresses even attribution-only hotspots.
    diagnostic_hotspots:incomplete?{status:'PARTIAL_PROVIDER_OBSERVATION',jobs:[]}:summary.diagnostic_hotspots,
    observed_at:new Date(now).toISOString(),
    repository:repo,
    workflow_runs_sampled:sampledRuns,
    provider_reads_attempted:sampledRuns+1,
    requested_run_read_limit:MAX_RUNS,
    workflow_runs_available:records.workflow_runs.length,
    read_errors:readErrors,
    status:incomplete?'PARTIAL_PROVIDER_OBSERVATION':summary.status,
    // Never report p50/p95 as valid if selected run reads were incomplete.
    p50_wait_to_start_ms:incomplete?null:summary.p50_wait_to_start_ms,
    p95_wait_to_start_ms:incomplete?null:summary.p95_wait_to_start_ms,
    p50_execution_ms:incomplete?null:summary.p50_execution_ms,
    p95_execution_ms:incomplete?null:summary.p95_execution_ms,
    automation_allowed:false,
    changes_to_required_ci:false
  };
  return {...result,agent_priority_advice:routeObservedCiHotspots(result)};
}

if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  try{
    const result=await collectObservedCiThroughput();
    await mkdir('.artifacts',{recursive:true});
    await writeFile(OUT,JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({
      status:result.status,workflow_runs_sampled:result.workflow_runs_sampled,
      sample_jobs:result.sample_jobs,distinct_runs:result.distinct_runs,
      p50_wait_to_start_ms:result.p50_wait_to_start_ms,
      p95_wait_to_start_ms:result.p95_wait_to_start_ms,
      slowest_executed_job_ms:result.diagnostic_hotspots.jobs[0]?.execution_ms??null,
      agent_advice_status:result.agent_priority_advice.status,
      owner_lanes:result.agent_priority_advice.priorities.map(x=>x.lane),
      read_errors:result.read_errors.length
    }));
    if(result.read_errors.length)process.exitCode=2;
  }catch(error){
    await mkdir('.artifacts',{recursive:true});
    await writeFile(OUT,JSON.stringify({
      schema:'powerhouse-observed-ci-job-telemetry-v1',
      status:'PROVIDER_OBSERVATION_UNAVAILABLE',
      observed_at:new Date().toISOString(),
      p50_wait_to_start_ms:null,p95_wait_to_start_ms:null,
      p50_execution_ms:null,p95_execution_ms:null,
      reason:String(error?.message||'UNKNOWN').slice(0,100)
    },null,2)+'\n');
    console.error('CI_THROUGHPUT_OBSERVATION_NOT_PROVEN');
    process.exitCode=2;
  }
}
