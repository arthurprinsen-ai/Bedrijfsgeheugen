import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prioritizeObservedCiWork} from '../tools/delivery/ci-agent-priorities.mjs';

const SHA='a'.repeat(40);
function job(run,id,execution,kind='preflight'){
  return {
    run_id:run,run_attempt:1,job_id:id,head_sha:SHA,workflow_id:21,
    workflow_name:'Required test',job_name:kind,
    conclusion:'success',execution_ms:execution,wait_to_start_ms:3000
  };
}
function valid(){
  const jobs=[];
  for(let i=0;i<5;i++){
    jobs.push(job(100+i,1000+i,90000+i*1000,'website browser mobile'));
    for(let j=0;j<4;j++)jobs.push(job(100+i,2000+i*4+j,4000,'backend contract '+j));
  }
  return {schema:'powerhouse-observed-ci-job-telemetry-v1',
    status:'SAMPLED_METRICS_NOT_SLO',observed_at:'2026-10-23T11:00:00Z',
    sample_jobs:25,distinct_runs:5,read_errors:[],job_evidence:jobs};
}
test('multiple independent slow browser runs route advisory to website without new work',()=>{
  const x=prioritizeObservedCiWork(valid());
  assert.equal(x.status,'REPEATED_SLOW_JOB_ADVISORY');
  assert.equal(x.priorities.length,1);
  assert.equal(x.priorities[0].suggested_lane,'website');
  assert.equal(x.priorities[0].independent_run_attempts,5);
  assert.equal(x.priorities[0].median_execution_ms,92000);
  assert.equal(x.priorities[0].p95_execution_ms,94000);
  assert.equal(x.can_mutate,false);assert.equal(x.can_dispatch,false);assert.equal(x.can_promote,false);
});
test('a single extremely slow run cannot force an agent priority',()=>{
  const input=valid();
  for(const row of input.job_evidence){
    if(row.job_name==='website browser mobile')row.execution_ms=row.run_id===100?400000:9000;
  }
  const x=prioritizeObservedCiWork(input);
  assert.equal(x.status,'NO_REPEATED_SLOW_JOB_PROVEN');
  assert.deepEqual(x.priorities,[]);
});
test('under-sampled, partially read or inflated provider results never select work',()=>{
  const input=valid();
  assert.equal(prioritizeObservedCiWork({...input,read_errors:[{run_id:1}]}).status,'INSUFFICIENT_EVIDENCE');
  assert.equal(prioritizeObservedCiWork({...input,status:'PARTIAL_PROVIDER_OBSERVATION'}).priorities.length,0);
  assert.equal(prioritizeObservedCiWork({...input,sample_jobs:22}).status,'INSUFFICIENT_EVIDENCE');
  assert.equal(prioritizeObservedCiWork({...input,distinct_runs:6}).status,'EVIDENCE_REJECTED');
});
test('forged completed/skipped, duplicate IDs and impossible durations fail closed',()=>{
  const input=valid();
  const bad=[{...input.job_evidence[0],conclusion:'skipped'},input.job_evidence[0],
    {...input.job_evidence[0],execution_ms:-1}];
  for(const row of bad){
    const jobs=[...input.job_evidence];jobs[0]=row;
    if(row===input.job_evidence[0])jobs[1]=row;
    const r=prioritizeObservedCiWork({...input,job_evidence:jobs});
    assert.equal(r.status,'EVIDENCE_REJECTED');
    assert.deepEqual(r.priorities,[]);
  }
});
test('lane remains unassigned for ambiguous names; no fake owner',()=>{
  const input=valid();
  for(const row of input.job_evidence)if(row.job_name==='website browser mobile')row.job_name='opaque-task';
  const x=prioritizeObservedCiWork(input);
  assert.equal(x.priorities[0].suggested_lane,'unassigned');
});
test('reuse only current hourly Janitor and preserve all protected quality gates',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  assert.match(workflow,/cron: '17 \* \* \* \*'/);
  assert.match(workflow,/node tools\/delivery\/ci-throughput-telemetry\.mjs/);
  assert.match(workflow,/node tools\/delivery\/ci-agent-priorities\.mjs/);
  assert.match(workflow,/powerhouse-ci-agent-priorities\.json/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow,/ci-agent-priorities.*workflow_dispatch/);
});

test('matrix multiplicity cannot hide a repeated slow independent attempt',()=>{
  const input=valid();
  // Ten fast siblings on only one attempt used to outvote the five slow
  // independent workflow attempts in the raw row median.
  let nextId=3000;
  for(let i=0;i<10;i++)input.job_evidence.push(job(100,nextId++,1000,'website browser mobile'));
  input.sample_jobs=input.job_evidence.length;
  const advice=prioritizeObservedCiWork(input);
  assert.equal(advice.status,'REPEATED_SLOW_JOB_ADVISORY');
  assert.equal(advice.priorities.length,1);
  assert.equal(advice.priorities[0].independent_run_attempts,5);
  assert.equal(advice.priorities[0].sample_jobs,5);
  assert.equal(advice.priorities[0].matrix_job_rows,15);
  assert.equal(advice.priorities[0].median_execution_ms,92000);
  assert.equal(advice.priorities[0].p95_execution_ms,94000);
  assert.ok(advice.priorities[0].evidence.every(x=>x.execution_ms>=90000));
  assert.equal(advice.can_mutate,false);
  assert.equal(advice.can_dispatch,false);
});

test('one workflow attempt with many slow matrix siblings cannot fake recurring slow work',()=>{
  const input=valid();
  for(const row of input.job_evidence){
    if(row.job_name==='website browser mobile')row.execution_ms=row.run_id===100?300000:3000;
  }
  let nextId=3100;
  for(let i=0;i<18;i++)input.job_evidence.push(job(100,nextId++,300000,'website browser mobile'));
  input.sample_jobs=input.job_evidence.length;
  const advice=prioritizeObservedCiWork(input);
  assert.equal(advice.status,'NO_REPEATED_SLOW_JOB_PROVEN');
  assert.deepEqual(advice.priorities,[]);
  assert.equal(advice.can_promote,false);
});

test('reject mismatched head SHAs inside the same workflow attempt',()=>{
  const input=valid();
  const extra={...job(100,4000,100000,'website browser mobile'),head_sha:'b'.repeat(40)};
  input.job_evidence.push(extra);
  input.sample_jobs=input.job_evidence.length;
  const advice=prioritizeObservedCiWork(input);
  assert.equal(advice.status,'EVIDENCE_REJECTED');
  assert.equal(advice.reason,'RUN_ATTEMPT_SHA_INCONSISTENT');
  assert.deepEqual(advice.priorities,[]);
});

test('callers cannot lower the three-run or sixty-second quality floors',()=>{
  const input=valid();
  for(const row of input.job_evidence){
    if(row.job_name==='website browser mobile')row.execution_ms=3000;
  }
  const advisory=prioritizeObservedCiWork(input,{minRepeatedRuns:1,minMedianMs:0});
  assert.equal(advisory.status,'NO_REPEATED_SLOW_JOB_PROVEN');
  assert.deepEqual(advisory.priorities,[]);
});
