import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeObservedCiJobs} from '../tools/delivery/predictive-controller.mjs';
import {summarizeObservedCiStepPhases} from '../tools/delivery/ci-step-phase-evidence.mjs';

const T=Date.parse('2026-10-23T09:00:00Z'),iso=n=>new Date(T+n).toISOString();
const SHA='a'.repeat(40);
function record(i,{stepName='Validate full-site English cache',duration=null,conclusion='success'}={}){
  const group=Math.floor(i/4),base=group<3?[30000,40000,50000][group]:7000;
  const elapsed=duration??base;
  return {
    run:{id:300+group,run_attempt:1,workflow_id:91,head_sha:SHA,
      name:'Required test PR #test',status:'completed'},
    job:{id:1000+i,name:group<3?'preflight':'backend',status:'completed',
      conclusion:'success',created_at:iso(0),started_at:iso(1000),completed_at:iso(101000),
      steps:[{number:1,name:stepName,status:'completed',conclusion,
        started_at:iso(3000),completed_at:iso(3000+elapsed)}]
    }
  };
}
const observed=()=>Array.from({length:20},(_,i)=>record(i));

test('real job steps give repeated 3-attempt step evidence, not a causal path',()=>{
  const rows=observed(),summary=summarizeObservedCiJobs(rows);
  assert.equal(summary.status,'SAMPLED_METRICS_NOT_SLO');
  const phase=summary.step_phase_evidence;
  assert.equal(phase.status,'REPEATED_STEP_SAMPLES_NOT_SLO');
  assert.equal(phase.accepted_step_observations,20);
  assert.equal(phase.recurrent_phases.length,2);
  const top=phase.recurrent_phases[0];
  assert.equal(top.workflow_id,91);
  assert.equal(top.job_name,'preflight');
  assert.equal(top.step_name,'Validate full-site English cache');
  assert.equal(top.distinct_attempts,3);
  assert.equal(top.sample_p50_execution_ms,40000);
  assert.equal(top.sample_max_execution_ms,50000);
  assert.equal(top.exemplar.run_id,302);
  assert.equal(top.exemplar.head_sha,SHA);
  assert.equal(phase.critical_path_proven,false);
  assert.equal(phase.causal_speedup_proven,false);
  assert.equal(phase.may_dispatch,false);
  assert.equal(phase.may_mutate,false);
  assert.equal(phase.may_promote,false);
});

test('one-off slow provider step never becomes a recurring bottleneck',()=>{
  const rows=observed();
  rows[0].job.steps[0].name='One-off 99-second installation';
  rows[0].job.steps[0].completed_at=iso(102000); // outside containing 100-second job
  const x=summarizeObservedCiJobs(rows);
  assert.equal(x.step_phase_evidence.recurrent_phases[0].step_name,'Validate full-site English cache');
  assert.equal(x.step_phase_evidence.rejected_step_observations,1);
  assert.ok(x.step_phase_evidence.recurrent_phases.every(p=>p.step_name!=='One-off 99-second installation'));
});

test('incomplete jobs or too few distinct workflow attempts cannot claim step p50',()=>{
  const rows=observed().slice(0,12);
  const a=summarizeObservedCiJobs(rows);
  assert.equal(a.step_phase_evidence.status,'INSUFFICIENT_VERIFIED_JOBS');
  assert.deepEqual(a.step_phase_evidence.recurrent_phases,[]);
  const b=summarizeObservedCiStepPhases(rows,[],{minJobs:1,minRuns:1});
  assert.equal(b.status,'INSUFFICIENT_VERIFIED_JOBS'); // thresholds never lowered
});

test('same workflow attempt counts once, even with parallel matrix jobs',()=>{
  const summary=summarizeObservedCiJobs(observed());
  assert.equal(summary.step_phase_evidence.recurrent_phases[0].distinct_attempts,3);
  assert.notEqual(summary.step_phase_evidence.recurrent_phases[0].distinct_attempts,12);
});

test('invalid, repeated and untrusted job steps never create fake phase evidence',()=>{
  const rows=observed();
  rows[0].job.steps.push({...rows[0].job.steps[0]});
  rows[1].job.steps[0].name='<script>bad</script>';
  rows[2].job.steps[0].started_at=iso(-1000);
  rows[3].job.steps[0].status='skipped';
  rows[4].job.steps[0].conclusion='cancelled';
  const result=summarizeObservedCiJobs(rows).step_phase_evidence;
  assert.ok(result.rejected_step_observations>=3);
  assert.ok(result.recurrent_phases.every(x=>!x.step_name.includes('<')));
});

test('canonical job proof mismatch suppresses phase attribution',()=>{
  const rows=observed(),result=summarizeObservedCiJobs(rows);
  const doubled=[...result.job_evidence,result.job_evidence[0]];
  const bad=summarizeObservedCiStepPhases(rows,doubled);
  assert.equal(bad.status,'INCONSISTENT_CANONICAL_JOB_EVIDENCE');
  assert.deepEqual(bad.recurrent_phases,[]);
  const shaMismatch=rows.map((x,i)=>i===0?{...x,run:{...x.run,head_sha:'b'.repeat(40)}}:x);
  const filtered=summarizeObservedCiStepPhases(shaMismatch,result.job_evidence);
  assert.equal(filtered.accepted_step_observations,19);
});

test('step analysis stays within original GitHub Actions job telemetry GET budget',async()=>{
  const {collectObservedCiThroughput}=await import('../tools/delivery/ci-throughput-telemetry.mjs');
  const all=observed(),runIds=[...new Set(all.map(x=>x.run.id))];
  const runs=runIds.map(id=>all.find(x=>x.run.id===id).run);
  let calls=0;
  const telemetry=await collectObservedCiThroughput({repo:'example/repo',now:T+200000,read:path=>{
    calls++;
    if(path.includes('status=completed'))return {workflow_runs:runs.map(run=>({...run,created_at:iso(0)}))};
    const id=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
    const jobs=all.filter(row=>row.run.id===id).map(x=>x.job);
    return {total_count:jobs.length,jobs};
  }});
  assert.equal(calls,6); // one completed-run list + five existing job list GETs
  assert.equal(telemetry.status,'SAMPLED_METRICS_NOT_SLO');
  assert.equal(telemetry.step_phase_evidence.status,'REPEATED_STEP_SAMPLES_NOT_SLO');
  assert.equal(telemetry.agent_priority_advice.may_dispatch,false);
});
