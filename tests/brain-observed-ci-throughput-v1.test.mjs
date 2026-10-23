import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizeObservedCiJobs} from '../tools/delivery/predictive-controller.mjs';
import {collectObservedCiThroughput} from '../tools/delivery/ci-throughput-telemetry.mjs';

const T=Date.parse('2026-10-23T06:00:00Z');
const iso=n=>new Date(T+n).toISOString();
const sha='a'.repeat(40);
function sample(runId,jobId,wait=1000,runtime=3000,attempt=1){
  return {
    run:{id:runId,run_attempt:attempt,head_sha:sha,workflow_id:66,status:'completed',created_at:iso(0)},
    job:{id:jobId,status:'completed',conclusion:'success',created_at:iso(0),started_at:iso(wait),completed_at:iso(wait+runtime)}
  };
}

test('one job is evidence but never sufficient to claim p95 or speedup',()=>{
  const x=summarizeObservedCiJobs([sample(1,10)]);
  assert.equal(x.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(x.sample_jobs,1);
  assert.equal(x.p95_wait_to_start_ms,null);
  assert.equal(x.p50_execution_ms,null);
});

test('sufficient independent workflow attempts produce observed percentiles',()=>{
  const rows=Array.from({length:20},(_,i)=>sample(100+Math.floor(i/4),1000+i,1000+i*100,2000+i*100));
  const x=summarizeObservedCiJobs(rows);
  assert.equal(x.status,'SAMPLED_METRICS_NOT_SLO');
  assert.equal(x.distinct_runs,5);
  assert.equal(x.sample_jobs,20);
  assert.equal(x.p50_wait_to_start_ms,1900);
  assert.equal(x.p95_wait_to_start_ms,2800);
  assert.equal(x.p50_execution_ms,2900);
  assert.equal(x.p95_execution_ms,3800);
});

test('duplicates, incomplete identities and impossible times cannot become success',()=>{
  const rows=[
    sample(1,101),
    sample(1,101),
    {...sample(2,102),job:{...sample(2,102).job,started_at:null}},
    {...sample(3,103),job:{...sample(3,103).job,status:'in_progress'}},
    {...sample(4,104),run:{...sample(4,104).run,head_sha:'bad'}}
  ];
  const x=summarizeObservedCiJobs(rows);
  assert.equal(x.sample_jobs,1);
  assert.deepEqual(x.rejected,{invalid_identity:1,partial_job:1,non_executed:0,invalid_time:1,duplicate:1});
  assert.equal(x.p95_wait_to_start_ms,null);
});

test('collector has bounded GET fanout and partial provider failure suppresses p95',async()=>{
  const runs=Array.from({length:30},(_,i)=>({id:i+1,run_attempt:1,head_sha:sha,status:'completed',created_at:iso(0)}));
  let calls=0;
  const read=path=>{
    calls++;
    if(path.includes('status=completed'))return {workflow_runs:runs};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    if(id===2)throw new Error('simulated provider 503');
    return {total_count:1,jobs:[sample(id,1000+id).job]};
  };
  const x=await collectObservedCiThroughput({repo:'example/repo',now:T+10000,read});
  assert.equal(calls,25);
  assert.equal(x.workflow_runs_sampled,24);
  assert.equal(x.read_errors.length,1);
  assert.equal(x.status,'PARTIAL_PROVIDER_OBSERVATION');
  assert.equal(x.p95_wait_to_start_ms,null);
  assert.equal(x.automation_allowed,false);
});

test('janitor reuses one existing hourly schedule and does not skip security gates',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  assert.match(yaml,/cron: '17 \* \* \* \*'/);
  assert.match(yaml,/node tools\/delivery\/ci-throughput-telemetry\.mjs/);
  assert.match(yaml,/continue-on-error: true/);
  assert.match(yaml,/powerhouse-ci-throughput\.json/);
  assert.match(yaml,/github-actions-ghost-reconcile\.mjs/);
  assert.doesNotMatch(yaml,/ci-throughput.*workflow_dispatch/);
});


test('adaptive sampling stops as soon as 20 independent jobs across five runs exist',async()=>{
  const runs=Array.from({length:30},(_,i)=>({id:i+1,run_attempt:1,head_sha:sha,status:'completed',created_at:iso(0)}));
  let requests=0;
  const read=path=>{
    requests++;
    if(path.includes('status=completed'))return {workflow_runs:runs};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    const jobs=Array.from({length:3},(_,idx)=>sample(id,id*100+idx,1000+idx*100,3000).job);
    return {total_count:jobs.length,jobs};
  };
  const x=await collectObservedCiThroughput({repo:'example/repo',now:T+10_000,read});
  assert.equal(x.status,'SAMPLED_METRICS_NOT_SLO');
  assert.equal(x.sample_jobs,21);
  assert.equal(x.distinct_runs,7);
  assert.equal(x.workflow_runs_sampled,7);
  assert.equal(requests,8);
  assert.equal(x.p95_wait_to_start_ms,1200);
  assert.deepEqual(x.read_errors,[]);
});

test('adaptive budget remains finite and never masks an earlier missing read',async()=>{
  const runs=Array.from({length:30},(_,i)=>({id:i+1,run_attempt:1,head_sha:sha,status:'completed',created_at:iso(0)}));
  let count=0;
  const read=path=>{
    count++;
    if(path.includes('status=completed'))return {workflow_runs:runs};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    if(id===1)throw Error('provider boundary');
    const jobs=Array.from({length:3},(_,i)=>sample(id,id*100+i).job);
    return {total_count:3,jobs};
  };
  const x=await collectObservedCiThroughput({repo:'example/repo',now:T+10_000,read});
  assert.equal(x.status,'PARTIAL_PROVIDER_OBSERVATION');
  assert.equal(x.workflow_runs_sampled,24);
  assert.equal(count,25);
  assert.equal(x.p95_execution_ms,null);
});


test('skipped zero-duration provider jobs never dilute actual p50/p95 or slowest jobs',()=>{
  const executed=Array.from({length:20},(_,i)=>{
    const row=sample(100+Math.floor(i/4),1000+i,1000,2000+i*100);
    row.run.name='Required test';
    row.job.name=i===19?'browser release check':'backend contract';
    return row;
  });
  const skipped={...sample(999,999,0,0),job:{...sample(999,999,0,0).job,
    name:'supabase_preview',conclusion:'skipped'}};
  const x=summarizeObservedCiJobs([...executed,skipped]);
  assert.equal(x.sample_jobs,20);
  assert.equal(x.rejected.non_executed,1);
  assert.equal(x.status,'SAMPLED_METRICS_NOT_SLO');
  assert.equal(x.p50_execution_ms,2900);
  assert.equal(x.p95_execution_ms,3800);
  assert.equal(x.diagnostic_hotspots.status,'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH');
  assert.equal(x.diagnostic_hotspots.jobs.length,5);
  assert.equal(x.diagnostic_hotspots.jobs[0].job_name,'browser release check');
  assert.equal(x.diagnostic_hotspots.jobs[0].execution_ms,3900);
  assert.ok(x.diagnostic_hotspots.jobs.every(job=>job.conclusion==='success'));
});

test('provider incomplete / insufficient observations cannot report hotspots',async()=>{
  const tooSmall=summarizeObservedCiJobs([sample(1,10)]);
  assert.equal(tooSmall.diagnostic_hotspots.status,'INSUFFICIENT_EVIDENCE');
  assert.deepEqual(tooSmall.diagnostic_hotspots.jobs,[]);
  const runs=Array.from({length:24},(_,i)=>({id:i+1,run_attempt:1,head_sha:sha,status:'completed',created_at:iso(0)}));
  const observed=await collectObservedCiThroughput({repo:'example/repo',now:T+10_000,read:path=>{
    if(path.includes('status=completed'))return {workflow_runs:runs};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    if(id===2)throw Error('partial GitHub provider read');
    return {total_count:3,jobs:Array.from({length:3},(_,i)=>sample(id,id*100+i).job)};
  }});
  assert.equal(observed.status,'PARTIAL_PROVIDER_OBSERVATION');
  assert.equal(observed.diagnostic_hotspots.status,'PARTIAL_PROVIDER_OBSERVATION');
  assert.deepEqual(observed.diagnostic_hotspots.jobs,[]);
});
