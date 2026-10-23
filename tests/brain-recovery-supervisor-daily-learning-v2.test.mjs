import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSupervisorDailyLearning,evaluateIndependentOptimization}
  from '../tools/delivery/recovery-supervisor-daily-learning.mjs';

const head='a'.repeat(40),merge='b'.repeat(40);
const release=(i,hours=12)=>({
  pr_number:i+100,head_sha:head,required_sha:head,codeql_sha:head,
  merge_sha:i.toString(16).padStart(40,'0'),production_sha:i.toString(16).padStart(40,'0'),
  pr_opened_at:'2026-10-01T00:00:00Z',
  production_verified_at:new Date(Date.parse('2026-10-01T00:00:00Z')+hours*3600000).toISOString(),
  ci_attempts:1,required_conclusion:'success',codeql_conclusion:'success',
  production_provider_verified:true,regression_passed:true,
  evidence_sources:{github_actions_required:true,github_codeql:true,
    protected_github_merge:true,production_provider:true}
});
const proof={independent_evaluator:true,security_regressions:0,
  required_gate_regressions:0,rollback_verified:true,same_workload_comparison:true};

test('no release measurements means optimization is denied and unknown fields stay null',()=>{
  const x=buildSupervisorDailyLearning({supervisor:{
    status:'SAMPLED_EXECUTION_NOT_RELEASE_SLO',runs:[{run_id:91}],
    read_errors:[],repeated_drift_prs:[4792],
    observed_event_categories:{WRITER_LEASE_MISSING:7,CAS_OR_PROVIDER_REJECTION_UNVERIFIED:3}
  },now:'2026-10-23T14:00:00Z'});
  assert.equal(x.utc_day,'2026-10-23');
  assert.deepEqual(x.supervisor_run_ids,[91]);
  assert.deepEqual(x.repeated_drift_prs,[4792]);
  assert.equal(x.writer_lease_denials,7);
  assert.equal(x.confirmed_stale_head_cas_rejections,null);
  assert.equal(x.unnecessary_ci_repetitions_proven,null);
  assert.equal(x.time_to_successful_production_ms,null);
  assert.equal(x.optimization.can_auto_apply,false);
  assert.equal(x.can_promote,false);
});

test('partial provider evidence never becomes zero incidents or green',()=>{
  const x=buildSupervisorDailyLearning({supervisor:{
    status:'PARTIAL_PROVIDER_OBSERVATION',read_errors:[{run_id:1}],
    runs:[],repeated_drift_prs:[],observed_event_categories:{WRITER_LEASE_MISSING:0}
  }});
  assert.equal(x.status,'INCOMPLETE_SUPERVISOR_EVIDENCE');
  assert.equal(x.writer_lease_denials,null);
  assert.equal(x.repeated_drift_prs,null);
  assert.equal(x.optimization.improvement_supported,false);
});

test('an unverified production SHA blocks release timing and optimization',()=>{
  const baseline=Array.from({length:20},(_,i)=>release(i,20));
  const candidate=Array.from({length:20},(_,i)=>release(i+20,10));
  candidate[0].production_sha=merge;
  const a=evaluateIndependentOptimization({baseline,candidate,regression:proof});
  assert.equal(a.status,'INSUFFICIENT_INDEPENDENT_RELEASE_EVIDENCE');
  assert.equal(a.candidate,null);
  assert.equal(a.can_auto_apply,false);
});

test('CodeQL exact SHA mismatch, test failure or missing independent evaluator block',()=>{
  const baseline=Array.from({length:20},(_,i)=>release(i,20));
  const candidate=Array.from({length:20},(_,i)=>release(i+20,10));
  candidate[0].codeql_sha=merge;
  assert.equal(evaluateIndependentOptimization({baseline,candidate,regression:proof}).improvement_supported,false);
  candidate[0].codeql_sha=head;
  assert.equal(evaluateIndependentOptimization({baseline,candidate,
    regression:{...proof,independent_evaluator:false}}).improvement_supported,false);
});

test('verified paired baseline is only shadow-review eligible, never auto-applied',()=>{
  const baseline=Array.from({length:20},(_,i)=>release(i,20));
  const candidate=Array.from({length:20},(_,i)=>release(i+20,10));
  const a=evaluateIndependentOptimization({baseline,candidate,regression:proof});
  assert.equal(a.status,'CANDIDATE_SHADOW_REVIEW_ELIGIBLE');
  assert.equal(a.candidate.samples,20);
  assert.equal(a.baseline.p95_to_production_ms,20*3600000);
  assert.equal(a.candidate.p95_to_production_ms,10*3600000);
  assert.equal(a.improvement_supported,true);
  assert.equal(a.can_auto_apply,false);
  assert.equal(a.can_bypass_required_or_codeql,false);
});

test('performance gains with reliability regression are not promoted',()=>{
  const baseline=Array.from({length:20},(_,i)=>release(i,20));
  const candidate=Array.from({length:20},(_,i)=>({...release(i+20,10),ci_attempts:3}));
  const a=evaluateIndependentOptimization({baseline,candidate,regression:proof});
  assert.equal(a.status,'NO_PROVEN_NONREGRESSING_IMPROVEMENT');
  assert.equal(a.improvement_supported,false);
});
