import test from 'node:test';
import assert from 'node:assert/strict';
import {rankRecoveryCandidates,inspectRepeatExecutions,locateMeasuredDelay,assessTechniqueEvidence} from '../tools/delivery/ci-adaptive-pr-planner.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),repo={full_name:'arthurprinsen-ai/Bedrijfsgeheugen'};
const pr=(n,days=1,head=a)=>({number:n,state:'open',updated_at:'2026-10-'+String(23-days).padStart(2,'0')+'T12:00:00Z',
 base:{ref:'main',repo,sha:b},head:{repo,sha:head,ref:'branch'},
 body:'Obligation-ID: task-'+n+'\nWriter-Lease-State: TERMINAL_DELIVERY\nWriter-Lease-Owner: owner\nWriter-Lease-Head: '+head+'\nWriter-Lease-Obligation: task-'+n});
test('oldest unique leased PR first, never an unleased merge authorization',()=>{
 const bad={...pr(3,6),body:'Obligation-ID: task-3'};
 const out=rankRecoveryCandidates([pr(1),bad,pr(2,5)],[],{now:'2026-10-23T15:00:00Z'});
 assert.deepEqual(out.ranked_prs.map(p=>p.number),[2,1,3]);
 assert.equal(out.verified_safe_to_sync,false);
 assert.equal(out.advisory.at(-1).status,'EXISTING_SUPERVISOR_EVALUATION_ONLY');
});
test('active exact-head checks deferred without touching gate policy',()=>{
 const r={status:'queued',event:'pull_request',head_sha:a,name:'Required test PR #1 '+a};
 const out=rankRecoveryCandidates([pr(1),pr(2,1,c)],[r],{now:'2026-10-23T15:00:00Z'});
 assert.equal(out.ranked_prs[0].number,2);
 assert.equal(out.advisory[1].status,'WAIT_FOR_ACTIVE_EXACT_HEAD_CI');
});
test('wrong lease or exhausted CAS and duplicate obligation are not safe',()=>{
 const x={...pr(1),body:pr(1).body+'\nWriter-Lease-Drift-Refreshes: 2'};
 const y={...pr(2),body:pr(2).body.replace('Writer-Lease-Head: '+a,'Writer-Lease-Head: '+c)};
 const z={...pr(3),body:pr(3).body.replace('task-3','task-2')};
 const out=rankRecoveryCandidates([x,y,z],[],{now:'2026-10-23T15:00:00Z'});
 assert.ok(out.advisory.every(i=>i.status==='EXISTING_SUPERVISOR_EVALUATION_ONLY'));
});
test('duplicates require workflow id, exact SHA and real PR events',()=>{
 const row={workflow_id:10,head_sha:a,event:'pull_request',created_at:'2026-10-23T10:00:00Z'};
 const s=inspectRepeatExecutions([{...row,id:1},{...row,id:2},{...row,id:2},{...row,id:3,head_sha:b},{...row,id:4,event:'workflow_dispatch'}]);
 assert.equal(s.total_repeat_executions_lower_bound,1);
 assert.equal(s.can_waive_required_or_codeql,false);
});
test('paired telemetry reports missing evidence and measured runner bottleneck',()=>{
 const jobs=Array.from({length:11},(_,i)=>({queue_seconds:i===0?null:60,execution_seconds:10}));
 assert.equal(locateMeasuredDelay(jobs).bottleneck,'RUNNER_QUEUE_WAIT');
 assert.equal(locateMeasuredDelay(jobs.slice(0,3)).status,'INSUFFICIENT_PAIRED_JOB_EVIDENCE');
});
test('AI independent baseline, regressions, controlled rollout; zero self-promotion',()=>{
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
test('workflow integration does not add scheduler or waive gates',async()=>{
 const fs=await import('node:fs');
 const supervisor=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.match(supervisor,/ci-adaptive-pr-planner\.mjs --rank/);
 assert.match(supervisor,/if gh api .*actions\/runs\?per_page=100/);
 assert.match(supervisor,/done < <\(jq -c '\.\[\]' \/tmp\/open-prs\.json\)/);
 assert.match(supervisor,/MAX_MAIN_DRIFT_REFRESHES/);
});
