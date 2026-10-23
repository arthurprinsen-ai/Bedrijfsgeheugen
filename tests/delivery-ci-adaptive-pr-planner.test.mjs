import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRepeatExecutions,locateMeasuredDelay,assessTechniqueEvidence} from '../tools/delivery/ci-adaptive-pr-planner.mjs';
const a='a'.repeat(40),b='b'.repeat(40);
test('exact SHA and workflow identity distinguish repeats from distinct PR revisions',()=>{
 const item={workflow_id:10,head_sha:a,event:'pull_request',created_at:'2026-10-23T10:00:00Z'};
 const x=inspectRepeatExecutions([{...item,id:1},{...item,id:2},{...item,id:2},{...item,id:3,head_sha:b},
   {...item,id:4,event:'workflow_dispatch'},{...item,id:5,workflow_id:11}]);
 assert.equal(x.total_repeat_executions_lower_bound,1);assert.equal(x.can_waive_required_or_codeql,false);
 assert.deepEqual(x.repeat_groups[0].run_ids,[1,2]);
});
test('paired queue and execution observations must meet minimum coverage',()=>{
 const jobs=Array.from({length:11},(_,i)=>({queue_seconds:i===0?null:60,execution_seconds:10}));
 assert.equal(locateMeasuredDelay(jobs).bottleneck,'RUNNER_QUEUE_WAIT');
 assert.equal(locateMeasuredDelay(jobs.slice(0,3)).status,'INSUFFICIENT_PAIRED_JOB_EVIDENCE');
 assert.equal(locateMeasuredDelay(Array.from({length:12},()=>({queue_seconds:1,execution_seconds:80}))).bottleneck,'JOB_EXECUTION');
});
test('one invalid dimension never counts as free zero-seconds execution',()=>{
 const rows=Array.from({length:15},()=>({queue_seconds:0,execution_seconds:null}));
 assert.equal(locateMeasuredDelay(rows).status,'INSUFFICIENT_PAIRED_JOB_EVIDENCE');
});
test('new technique comparator needs independent evidence and rollback; no direct promotion',()=>{
 const p={baseline:{samples:35,latency_p95_ms:100,failure_rate:0.01,evidence_ref:'run-1',dataset_id:'same'},
 candidate:{samples:35,latency_p95_ms:90,failure_rate:0.01,evidence_ref:'run-2',dataset_id:'same',producer:'agent'},
 evaluation:{independent:true,evaluator:'assurance',evidence_ref:'run-3',regressions_passed:true,security_passed:true,comparator_matched:true},
 rollout:{shadow_proven:true,canary_proven:true,rollback_tested:true,provider_readback:true,controlled_exposure_proven:true}};
 assert.equal(assessTechniqueEvidence(p).status,'ELIGIBLE_FOR_EXISTING_PROTECTED_RELEASE_GATES');
 assert.equal(assessTechniqueEvidence(p).production_behavior_change_allowed,false);
 assert.equal(assessTechniqueEvidence({...p,candidate:{...p.candidate,latency_p95_ms:120}}).status,'QUALITY_STEPS_HOLD');
 assert.equal(assessTechniqueEvidence({...p,rollout:{...p.rollout,canary_proven:false}}).status,'QUALITY_STEPS_HOLD');
 assert.equal(assessTechniqueEvidence({}).status,'QUALITY_STEPS_HOLD');
});
