import test from 'node:test';
import assert from 'node:assert/strict';
import {collectObservedCiThroughput} from '../tools/delivery/ci-throughput-telemetry.mjs';

const repo='owner/repo',sha='a'.repeat(40);
const now=Date.parse('2026-10-25T19:30:00Z');
const runs=Array.from({length:50},(_,i)=>({
  id:1000+i,run_attempt:1,status:'completed',head_sha:sha,
  created_at:new Date(now-(i+1)*60000).toISOString()
}));

test('bounded sampling reaches 48 when older valid job coverage is needed',async()=>{
  const paths=[];
  const output=await collectObservedCiThroughput({repo,now,read:path=>{
    paths.push(path);
    if(path.includes('/actions/runs?'))return {workflow_runs:runs};
    return {jobs:[],total_count:0};
  }});
  assert.equal(output.workflow_runs_sampled,48);
  assert.equal(output.provider_reads_attempted,49);
  assert.equal(output.requested_run_read_limit,48);
  assert.equal(output.workflow_runs_available,50);
  assert.equal(output.automation_allowed,false);
  assert.equal(output.agent_priority_advice.can_mutate,false);
  assert.equal(paths.length,49);
});

test('incomplete provider job response still fails closed',async()=>{
  const output=await collectObservedCiThroughput({repo,now,read:path=>
    path.includes('/actions/runs?')
      ? {workflow_runs:runs}
      : {jobs:[],total_count:1}
  });
  assert.equal(output.status,'PARTIAL_PROVIDER_OBSERVATION');
  assert.equal(output.read_errors[0].reason,'JOBS_SNAPSHOT_INCOMPLETE');
  assert.equal(output.workflow_runs_sampled,1);
  assert.equal(output.agent_priority_advice.can_mutate,false);
  assert.equal(output.p95_wait_to_start_ms,null);
});
