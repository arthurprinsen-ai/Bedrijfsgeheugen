import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeObservedCiJobs } from '../tools/delivery/predictive-controller.mjs';
import { projectObservedCicdTaskRuns,reconcileCicdProjectionWithCanonical } from '../tools/delivery/ci-cicd-semconv-projection.mjs';
import { collectObservedCiThroughput } from '../tools/delivery/ci-throughput-telemetry.mjs';

const base=Date.parse('2026-10-23T10:30:00Z');
const iso=n=>new Date(base+n).toISOString();
const SHA='b'.repeat(40);
const obs=(count=20)=>Array.from({length:count},(_,i)=>({
 run:{id:800+Math.floor(i/4),run_attempt:1,head_sha:SHA,
  status:'completed',name:'Required test',workflow_id:88,created_at:iso(0)},
 job:{id:20000+i,name:'backend / backend',status:'completed',
  conclusion:i===0?'failure':'success',created_at:iso(0),
  started_at:iso(1000),completed_at:iso(3000+i)}
}));
const project=(rows)=>projectObservedCicdTaskRuns({repo:'example/repo',
 observations:rows,status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});

test('source-only CI task projection reconciles exact ID, SHA, result and duration to canonical estimator',()=>{
 const rows=obs(), summary=summarizeObservedCiJobs(rows);
 assert.equal(summary.status,'SAMPLED_METRICS_NOT_SLO');
 const result=reconcileCicdProjectionWithCanonical(project(rows),summary);
 assert.equal(result.status,'SOURCE_ONLY_FIELD_COMPATIBLE');
 assert.equal(result.canonical_reconciled,true);
 assert.equal(result.canonical_jobs_total,20);
 assert.equal(result.canonical_sample_bounded,false);
 assert.equal(result.records.length,20);
 assert.equal(result.release_authorized,false);
 assert.equal(result.exported,false);
});

test('altered canonical SHA, duration, job identity, job name or duplicated identity block all semantic proof',()=>{
 const rows=obs(), original=summarizeObservedCiJobs(rows);
 for(const modification of [
  {head_sha:'c'.repeat(40)},
  {execution_ms:33333},
  {job_id:999999},
  {job_name:'Different'},
  {conclusion:'failure'}
 ]){
  const damaged={...original,job_evidence:original.job_evidence.map((row,i)=>
   i===1?{...row,...modification}:row)};
  const attested=reconcileCicdProjectionWithCanonical(project(rows),damaged);
  assert.equal(attested.status,'CANONICAL_JOB_EVIDENCE_MISMATCH');
  assert.equal(attested.canonical_reconciled,false);
  assert.equal(attested.records.length,0);
  assert.equal(attested.release_authorized,false);
 }
 const duplicate={...original,job_evidence:[original.job_evidence[0],original.job_evidence[0],...original.job_evidence.slice(2)]};
 assert.equal(reconcileCicdProjectionWithCanonical(project(rows),duplicate).records.length,0);
});

test('partial/rejected provider inputs and unsupported canonical evidence never result in a green attestation',()=>{
 const rows=obs();
 const source=project(rows);
 for(const canonical of [
  undefined,{}, {status:'INSUFFICIENT_EVIDENCE',sample_jobs:20,job_evidence:summarizeObservedCiJobs(rows).job_evidence},
  {...summarizeObservedCiJobs(rows),sample_jobs:21},
  {...summarizeObservedCiJobs(rows),job_evidence:[]}
 ]){
  const result=reconcileCicdProjectionWithCanonical(source,canonical);
  assert.equal(result.canonical_reconciled,false);
  assert.equal(result.records.length,0);
 }
 const partial=reconcileCicdProjectionWithCanonical({
  status:'INCOMPLETE_OR_INSUFFICIENT_SOURCE',records:[],exported:false,
  provider_snapshot_complete:false},summarizeObservedCiJobs(rows));
 assert.equal(partial.canonical_reconciled,false);
 assert.equal(partial.records.length,0);
});

test('bounded >64 sample never claims full canonical coverage',()=>{
 const rows=obs(72);
 const summary=summarizeObservedCiJobs(rows);
 const attested=reconcileCicdProjectionWithCanonical(project(rows),summary);
 assert.equal(attested.canonical_reconciled,true);
 assert.equal(attested.records.length,64);
 assert.equal(attested.canonical_jobs_total,72);
 assert.equal(attested.canonical_sample_bounded,true);
});

test('original hourly Janitor emits reconciled source data without extra GitHub reads or writes',async()=>{
 const rows=obs();
 const runs=[...new Map(rows.map(x=>[x.run.id,x.run])).values()];
 let reads=0;
 const result=await collectObservedCiThroughput({
  repo:'example/repo',now:base+10000,read:path=>{
   reads++;
   if(path.includes('status=completed'))return {workflow_runs:runs};
   const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
   const jobs=rows.filter(x=>x.run.id===id).map(x=>x.job);
   return {total_count:jobs.length,jobs};
  }
 });
 assert.equal(reads,6);
 assert.equal(result.status,'SAMPLED_METRICS_NOT_SLO');
 assert.equal(result.cicd_semconv_evidence.canonical_reconciled,true);
 assert.equal(result.cicd_semconv_evidence.records.length,20);
 assert.equal(result.agent_priority_advice.may_dispatch,false);
 assert.equal(result.automation_allowed,false);
 assert.equal(result.changes_to_required_ci,false);
});
