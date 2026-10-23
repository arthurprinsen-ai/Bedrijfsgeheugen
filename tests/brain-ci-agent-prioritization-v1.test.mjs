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
      id:id*100+i,name:id%2===0?'preflight':'backend',status:'completed',conclusion:'success',
      created_at:iso(0),started_at:iso(1000),completed_at:iso(3000+i*100)
    }))};
  }});
  assert.equal(x.status,'SAMPLED_METRICS_NOT_SLO');
  assert.equal(x.agent_priority_advice.status,'EVIDENCE_BACKED_INVESTIGATION_ONLY');
  assert.equal(x.agent_priority_advice.may_dispatch,false);
  assert.deepEqual(x.agent_priority_advice.priorities.map(p=>p.lane),['backend-supabase','powerhouse']);
});


test('real CodeQL JS security hotspot routes to CodeQL analysis, never unrelated preflight',()=>{
  const sha='4'.repeat(40);
  const jobs=[
    {run_id:39927850261,run_attempt:1,job_id:120328545101,head_sha:sha,
      workflow_name:'Powerhouse CodeQL',job_name:'CodeQL javascript-typescript',conclusion:'success',execution_ms:199000,wait_to_start_ms:3000},
    {run_id:39927728654,run_attempt:1,job_id:120328733393,head_sha:'6'.repeat(40),
      workflow_name:'Required test PR #4740',job_name:'netlify_build_parity',conclusion:'success',execution_ms:106000,wait_to_start_ms:3000}
  ];
  const evidence={status:'SAMPLED_METRICS_NOT_SLO',sample_jobs:21,distinct_runs:11,read_errors:[],
    diagnostic_hotspots:{status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',jobs}};
  const advice=routeObservedCiHotspots(evidence);
  assert.equal(advice.status,'EVIDENCE_BACKED_INVESTIGATION_ONLY');
  assert.deepEqual(advice.priorities.map(x=>x.lane),['powerhouse','website']);
  assert.equal(advice.priorities[0].action,'PROFILE_CODEQL_ANALYSIS_RUNTIME_PRESERVING_FULL_SECURITY_GATES');
  assert.equal(advice.priorities[0].job_id,120328545101);
  assert.equal(advice.priorities[0].observed_execution_ms,199000);
  assert.equal(advice.priorities[1].action,'COMPARE_EXACT_SHA_COLD_WARM_BUILD_AND_CONTENT_PARITY');
  assert.equal(advice.may_mutate,false);
  assert.equal(advice.may_dispatch,false);
  assert.equal(advice.may_promote,false);
  assert.ok(advice.mandatory_release_gates.includes('CodeQL'));
});

test('only CodeQL hotspots change the security-specific advice; ordinary preflight stays unchanged',()=>{
  const row={...observed.diagnostic_hotspots.jobs[0],job_name:'preflight',workflow_name:'Required test'};
  const advice=routeObservedCiHotspots({...observed,diagnostic_hotspots:{
    status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',jobs:[row]}});
  assert.equal(advice.priorities[0].action,'MEASURE_EXISTING_REQUIRED_PREFLIGHT_PHASE_WITHOUT_SKIPPING_GATES');
  assert.equal(advice.priorities[0].lane,'powerhouse');
});

test('independent recurrent medians take precedence over an isolated larger portal spike',()=>{
  const runs=[];
  const add=(id,workflow,name,duration)=>runs.push({
    run_id:id,run_attempt:1,job_id:id*10,head_sha:SHA,workflow_id:workflow,
    workflow_name:'Required test',job_name:name,conclusion:'success',
    execution_ms:duration,wait_to_start_ms:3000
  });
  add(201,21,'preflight',30000);
  add(202,21,'preflight',35000);
  add(203,21,'preflight',40000);
  add(204,22,'website',25000);
  add(205,22,'website',30000);
  add(206,22,'website',34000);
  add(207,23,'portal',100000);
  for(let i=0;i<13;i++)add(208+i,1000+i,'misc-'+i,1000);
  const evidence={
    status:'SAMPLED_METRICS_NOT_SLO',sample_jobs:20,distinct_runs:20,read_errors:[],
    job_evidence:runs,
    diagnostic_hotspots:{status:'SAMPLED_DIAGNOSTIC_NOT_CRITICAL_PATH',
      jobs:[...runs].sort((a,b)=>b.execution_ms-a.execution_ms).slice(0,5)},
    recurrent_hotspots:{status:'REPEATED_JOB_SAMPLE_NOT_SLO',minimum_distinct_attempts:3,jobs:[
      {workflow_id:21,job_name:'preflight',distinct_attempts:3,
        sample_p50_execution_ms:35000,sample_max_execution_ms:40000,representative_run_ids:[201,202,203]},
      {workflow_id:22,job_name:'website',distinct_attempts:3,
        sample_p50_execution_ms:30000,sample_max_execution_ms:34000,representative_run_ids:[204,205,206]}
    ]}
  };
  const advice=routeObservedCiHotspots(evidence);
  assert.equal(advice.status,'EVIDENCE_BACKED_INVESTIGATION_ONLY');
  assert.deepEqual(advice.priorities.map(p=>p.lane),['powerhouse','website','portal']);
  assert.deepEqual(advice.priorities.map(p=>p.evidence_basis),[
    'REPEATED_INDEPENDENT_ATTEMPTS','REPEATED_INDEPENDENT_ATTEMPTS',
    'ONE_OFF_PEAK_NOT_RECURRENT'
  ]);
  assert.equal(advice.priorities[0].repeated_attempts,3);
  assert.equal(advice.priorities[0].repeated_sample_p50_execution_ms,35000);
  assert.equal(advice.priorities[0].head_sha,SHA);
  assert.equal(advice.priorities[0].job_id,2030);
  assert.equal(advice.may_mutate,false);
  assert.equal(advice.may_dispatch,false);
  assert.equal(advice.may_promote,false);

  for(const altered of [
    {...evidence,recurrent_hotspots:{...evidence.recurrent_hotspots,jobs:[
      {...evidence.recurrent_hotspots.jobs[0],sample_p50_execution_ms:1},
      evidence.recurrent_hotspots.jobs[1]
    ]}},
    {...evidence,job_evidence:runs.slice(1)},
    {...evidence,job_evidence:[...runs.slice(0,19),runs[0]]},
    {...evidence,recurrent_hotspots:{...evidence.recurrent_hotspots,jobs:[
      {...evidence.recurrent_hotspots.jobs[0],distinct_attempts:7},
      evidence.recurrent_hotspots.jobs[1]
    ]}}
  ]){
    const invalid=routeObservedCiHotspots(altered);
    assert.equal(invalid.status,'WITHHELD_UNVERIFIED_RECURRENT_PROOF');
    assert.deepEqual(invalid.priorities,[]);
  }
});
