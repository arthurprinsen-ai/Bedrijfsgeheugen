import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_AGENT_TEAM,SHARED_INCIDENT_DUTIES,createDefaultAgentRegistry}
 from '../platform/agents/agent-team.mjs';
import {missingIncidentLearningProof,reconcileIncidentObligations}
 from '../brain/observability/incident-obligation-assurance.mjs';

const fingerprint='github|actions|workflow-202|failure';
const provider='github:run:41792546872:attempt:1';
const observation={provider_event_id:provider,fingerprint,observed_at:'2026-11-17T08:00:00Z',
 payload_sha256:'a'.repeat(64)};
const receipt={provider_event_id:provider,fingerprint,registered_at:'2026-11-17T08:01:00Z',
 readback_confirmed:true,payload_sha256:'a'.repeat(64)};
const recovery={provider_event_id:provider,fingerprint,owner:'original-ci-owner',
 obligation_id:'original-incident-obligation',fix_attempted:true,status:'VERIFIED',
 verified_at:'2026-11-17T08:14:00Z',regression_passed:true,
 independent_provider_readback:true,prevention_applied:true,release_sha:'b'.repeat(40),
 root_cause_ref:'brain:root-cause:v1',regression_ref:'brain:test:retry-v2',
 prevention_rule_ref:'brain:rule:retry-v2',documentation_ref:'docs:incident:20261117',
 skill_version:'skill:v2',source_revision:'source:rev-2',
 learning_application_ref:'brain:lesson:apply-2',consumer_processed_ref:'brain:ack:processed-2',
 next_natural_run_ref:'github:run:12345678',next_natural_run_at:'2026-11-17T08:40:00Z',
 learning_applied:true,original_consumer_processed:true,recurrence_checked:true};
const learningReceipt={provider_event_id:provider,fingerprint,source_revision:recovery.source_revision,
 learning_application_ref:recovery.learning_application_ref,
 consumer_processed_ref:recovery.consumer_processed_ref,consumer_state:'PROCESSED',
 readback_confirmed:true,consumer_owner:'original-learning-consumer',
 applied_at:'2026-11-17T08:20:00Z'};
const audit=override=>reconcileIncidentObligations({observations:[observation],
 receipts:[receipt],recoveries:[recovery],learningReceipts:[learningReceipt],
 sourceReadbackComplete:true,registryReadbackComplete:true,...override});

test('same fourteen registered agents inherit original observer/repair/learning/next-run duties',()=>{
 assert.equal(DEFAULT_AGENT_TEAM.length,14);
 assert.equal(SHARED_INCIDENT_DUTIES.length,5);
 assert.equal(new Set(DEFAULT_AGENT_TEAM.map(x=>x.id)).size,14);
 for(const agent of DEFAULT_AGENT_TEAM){
  for(const duty of SHARED_INCIDENT_DUTIES)assert.ok(agent.tasks.includes(duty),agent.id+':'+duty);
  assert.ok(agent.playbooks.includes('same-owner-observe-repair-regress-protect-release-readback-consumer-learn-recheck'));
  assert.ok(agent.learningContracts.includes('incident-recovery.v1'));
  const runtime=createDefaultAgentRegistry().get(agent.id);
  assert.ok(runtime);
  assert.ok(runtime.learningContracts.includes('incident-recovery.v1'));
 }
});
test('only source-bound independent consumer learning applied and next-run permits scoped recovered status',()=>{
 const result=audit();
 assert.equal(result.proven_recovered,1);
 assert.equal(result.status,'OBSERVED_INCIDENTS_INDEPENDENTLY_PROVEN');
 assert.equal(result.global_green,false,'no global coverage claims even when one scoped event verified');
 assert.deepEqual(missingIncidentLearningProof(recovery,[learningReceipt],observation),[]);
});
test('missing or self-certified learning receipts cannot mark incident proven',()=>{
 const variants=[
  {learningReceipts:[]},
  {learningReceipts:[{...learningReceipt,consumer_owner:recovery.owner}]},
  {learningReceipts:[{...learningReceipt,source_revision:'source:other'}]},
  {learningReceipts:[{...learningReceipt,readback_confirmed:false}]},
  {learningReceipts:[{...learningReceipt,consumer_state:'RECEIVED_NOT_PROCESSED'}]},
  {learningReceipts:[learningReceipt,learningReceipt]},
  {recoveries:[{...recovery,learning_applied:false}]},
  {recoveries:[{...recovery,root_cause_ref:null}]},
  {recoveries:[{...recovery,prevention_rule_ref:null}]},
  {recoveries:[{...recovery,documentation_ref:null}]},
  {recoveries:[{...recovery,regression_ref:null}]},
  {recoveries:[{...recovery,next_natural_run_ref:null}]},
  {recoveries:[{...recovery,next_natural_run_at:'2026-11-17T08:13:59Z'}]},
  {recoveries:[{...recovery,original_consumer_processed:false}]},
 ];
 for(const variant of variants){
  const result=audit(variant);
  assert.equal(result.proven_recovered,0,JSON.stringify(variant).slice(0,120));
  assert.equal(result.status,'RECOVERY_NOT_PROVEN');
  assert.ok(result.obligations[0].missing_proof?.length);
 }
});
test('repetition after scoped proven repair reopens original fingerprint and remains not green',()=>{
 const repeated={...observation,provider_event_id:'github:run:41792546873:attempt:2',observed_at:'2026-11-17T09:00:00Z'};
 const result=audit({observations:[observation,repeated],receipts:[receipt,{...receipt,
  provider_event_id:repeated.provider_event_id,registered_at:'2026-11-17T09:00:05Z'}]});
 assert.equal(result.recurring_failures,1);
 assert.equal(result.global_green,false);
 assert.ok(result.obligations.some(x=>x.status==='REGRESSION_RECURRED_AFTER_VERIFICATION'));
});
test('skills and source keep one canonical incident and original provider reporting guard',()=>{
 const skill=readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
 const improve=readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md','utf8');
 const observer=readFileSync('tools/delivery/github-actions-failure-observer.mjs','utf8');
 const runtime=readFileSync('brain/observability/incident-obligation-assurance.mjs','utf8');
 assert.match(skill,/public\.brain_observe_failure/);
 assert.match(skill,/consumer_state=PROCESSED/);
 assert.match(skill,/docs\/brain\/groen-draaiboek\.md/);
 assert.match(improve,/incident-recovery\.v1/);
 assert.match(improve,/RECOVERY_PROOF_MISSING/);
 assert.match(observer,/original-hourly-janitor/);
 assert.match(observer,/brain_observe_failure/);
 assert.match(runtime,/ORIGINAL_CONSUMER_PROCESSED_LEARNING_RECEIPT_MISSING/);
});
