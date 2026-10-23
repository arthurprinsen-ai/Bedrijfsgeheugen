import test from 'node:test';
import assert from 'node:assert/strict';
import {routeObservedCiHotspots} from '../tools/delivery/ci-agent-priority.mjs';
import {collectObservedCiThroughput} from '../tools/delivery/ci-throughput-telemetry.mjs';

const SHA='a'.repeat(40);
const observed={
  status:'SAMPLED_METRICS_NOT_SLO',sample_jobs:28,distinct_runs:13,read_errors:[],
  diagnostic_hotspots:{status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',jobs:[
    {run_id:101,run_attempt:1,job_id:111,head_sha:SHA,workflow_name:'Required test',job_name:'preflight',conclusion:'success',execution_ms:75000,wait_to_start_ms:3000},
    {run_id:102,run_attempt:1,job_id:112,head_sha:SHA,workflow_name:'Required test',job_name:'website',conclusion:'success',execution_ms:65000,wait_to_start_ms:2000},
    {run_id:103,run_attempt:1,job_id:113,head_sha:SHA,workflow_name:'Required test',job_name:'website',conclusion:'success',execution_ms:64000,wait_to_start_ms:2000},
    {run_id:104,run_attempt:1,job_id:114,head_sha:SHA,workflow_name:'Required test',job_name:'backend',conclusion:'success',execution_ms:40000,wait_to_start_ms:3000}
  ]}
};
test('real executed CI jobs produce deterministic cross-agent priority without dispatch or release',()=>{
  const x=routeObservedCiHotspots(observed);
  assert.equal(x.status,'EVIDENCE_BACKED_INVESTIGATION_ONLY');
  assert.deepEqual(x.priorities.map(z=>z.lane),['powerhouse','website','backend-supabase']);
  assert.deepEqual(x.priorities.map(z=>z.rank),[1,2,3]);
  assert.equal(x.priorities[1].observed_execution_ms,65000);
  assert.equal(x.priorities[1].head_sha,SHA);
  assert.equal(x.may_mutate,false);
  assert.equal(x.may_dispatch,false);
  assert.equal(x.may_promote,false);
  assert.equal(x.speedup_proven,false);
  assert.ok(x.mandatory_release_gates.includes('CodeQL'));
});
test('partial provider responses and insufficient independent runs suppress agent instructions',()=>{
  for(const data of [
    {...observed,status:'PARTIAL_PROVIDER_OBSERVATION'},
    {...observed,read_errors:[{reason:'GITHUB_JOB_READ_UNAVAILABLE'}]},
    {...observed,sample_jobs:19},
    {...observed,distinct_runs:4},
    {...observed,diagnostic_hotspots:{status:'INSUFFICIENT_EVIDENCE',jobs:[]}},
    {}
  ])assert.deepEqual(routeObservedCiHotspots(data).priorities,[]);
});
test('skipped placeholders, zero runtime, duplicate identities and fabricated SHA fail closed',()=>{
  const job=observed.diagnostic_hotspots.jobs[0];
  for(const bad of [
    {...job,conclusion:'skipped'},
    {...job,execution_ms:0},
    {...job,head_sha:'unknown'},
    {...job,run_attempt:0},
    {...job,job_name:''}
  ]){
    const x=routeObservedCiHotspots({...observed,diagnostic_hotspots:{status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',jobs:[bad]}});
    assert.equal(x.status,'WITHHELD_INVALID_PROVENANCE');
    assert.deepEqual(x.priorities,[]);
  }
  const x=routeObservedCiHotspots({...observed,diagnostic_hotspots:{status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',jobs:[job,job]}});
  assert.equal(x.status,'WITHHELD_INVALID_PROVENANCE');
});
test('unknown CI jobs are never assigned invented delivery owner',()=>{
  const job={...observed.diagnostic_hotspots.jobs[0],job_name:'opaque task',workflow_name:'unknown workflow'};
  const x=routeObservedCiHotspots({...observed,diagnostic_hotspots:{status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',jobs:[job]}});
  assert.equal(x.priorities[0].lane,'owner-unresolved');
  assert.equal(x.priorities[0].owner_resolution_required,true);
  assert.equal(x.priorities[0].action,'RESOLVE_CANONICAL_WORKFLOW_OWNER_BEFORE_MUTATION');
});
test('existing hourly collector embeds only advisory priorities; never dispatches',async()=>{
  const clock=Date.parse('2026-10-23T08:45:00Z');
  const iso=n=>new Date(clock+n).toISOString();
  const runs=Array.from({length:7},(_,i)=>({id:i+1,run_attempt:1,head_sha:SHA,status:'completed',created_at:iso(0),name:'Required test'}));
  const x=await collectObservedCiThroughput({repo:'example/repo',now:clock+10000,read:path=>{
    if(path.includes('status=completed'))return {workflow_runs:runs};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    return {total_count:3,jobs:Array.from({length:3},(_,i)=>({
      id:id*100+i,name:i===0?'preflight':'backend',status:'completed',conclusion:'success',
      created_at:iso(0),started_at:iso(1000),completed_at:iso(3000+i*100)
    }))};
  }});
  assert.equal(x.status,'SAMPLED_METRICS_NOT_SLO');
  assert.equal(x.agent_priority_advice.status,'EVIDENCE_BACKED_INVESTIGATION_ONLY');
  assert.equal(x.agent_priority_advice.may_dispatch,false);
  assert.deepEqual(x.agent_priority_advice.priorities.map(p=>p.lane),['backend-supabase','powerhouse']);
});
