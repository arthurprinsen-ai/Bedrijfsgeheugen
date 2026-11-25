import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateOriginalOwnerHandoff} from '../scripts/brain/innovation-original-owner-readback.mjs';
import {planOriginalAgentPreReviews,persistOriginalAgentPreReviews,CONTRACT}
  from '../scripts/brain/innovation-original-agent-pre-review.mjs';

const id='09687981-340d-4807-8f3a-089fc58bd7b0';
const operationId='ca50a66c-4f1b-4ec2-b630-487ba6ae5677';
const sha='a'.repeat(64);
const revision='2026-10-10T03:02:00Z';
const key='quality-learning-v1:source-proof';

function fixture(){
 const candidate={
   candidate_id:id,source_key:key,owner_agent:'engineering',component_id:'source-owner',
   created_at:'2026-11-14T17:45:27Z',status:'candidate',safety_class:'review_required',
   proposed_action:{kind:'bounded_learning_followup',human_review_required:true,
     provider_dispatch_authorized:false,regression_proven:false},
   rollback_plan:{required:true,route:'existing_protected_delivery'}
 };
 const obligation={
   business_entity:id,change_id:key,owner:'original-agent:engineering',
   state:'OPEN',payload_sha256:sha,evidence:{source_revision:revision}
 };
 const intake={
   id:operationId,operation_type:'INNOVATION_INTAKE',
   capability_id:'agent:agent-integration-engineer',status:'PLANNED',
   correlation_id:'innovation-delivery:'+id,
   idempotency_key:'innovation-delivery:'+id+':'+sha.slice(0,16),
   payload_sha256:sha,change_id:key,version:3,remote_ref:null,
   evidence:{execution_resilience:{state:'WAITING_ORIGINAL_AGENT_INTAKE',side_effect_state:'NOT_STARTED'}}
 };
 return {candidates:[candidate],obligations:[obligation],intakes:[intake]};
}
const now='2026-11-15T10:40:00Z';
const planning=snapshot=>planOriginalAgentPreReviews({
 snapshot,report:evaluateOriginalOwnerHandoff(snapshot,{now}),observedAt:now
});
const config={origin:'https://example.supabase.co',key:'service-role-fixture-key'};

test('actual original intake gets reversible source-bound pre-review with five required stages, never a false owner ACK',()=>{
 const packet=planning(fixture());
 assert.equal(packet.contract,CONTRACT);
 assert.equal(packet.work.length,1);
 const item=packet.work[0];
 assert.equal(item.agent,'agent:agent-integration-engineer');
 assert.equal(item.sourceRevision,revision);
 assert.equal(item.review.review_required,true);
 assert.equal(item.review.production_mutation_authorized,false);
 assert.equal(item.review.external_side_effect,false);
 assert.equal(item.review.consumer_ack_verified,false);
 assert.equal(item.review.terminal_success,false);
 assert.deepEqual(item.review.mandatory_stages,[
   'SOURCE_REGISTERED','ORIGINAL_AGENT_PRE_REVIEW',
   'PROTECTED_IMPLEMENTATION','INDEPENDENT_PROVIDER_OUTCOME','ONE_BRAIN_CONSUMED_AND_LEARNING'
 ]);
 assert.equal(packet.deferred_by_budget,0);
});

test('pre-review is source-idempotent and refuses silently drifting agent, revision or prior evidence',()=>{
 const snapshot=fixture();const planned=planning(snapshot);
 snapshot.intakes[0].evidence.original_agent_pre_review=planned.work[0].review;
 assert.deepEqual(planning(snapshot).held.map(x=>x.reason),['REVIEW_ALREADY_REGISTERED']);
 snapshot.intakes[0].evidence.original_agent_pre_review={...planned.work[0].review,fingerprint:'different'};
 assert.throws(()=>planning(snapshot),/PRIOR_REVIEW_CONFLICT/);
 const mismatched=fixture();mismatched.intakes[0].capability_id='agent:unknown';
 assert.throws(()=>planning(mismatched),/SOURCE_BOUND_IDENTITY_MISMATCH|OWNER_UNMAPPED/);
 const unsafe=fixture();delete unsafe.candidates[0].rollback_plan;
 assert.deepEqual(planning(unsafe).held.map(x=>x.reason),['REVIEW_SAFETY_EVIDENCE_REQUIRED']);
});

test('only original PLANNED operation without side effects can get the review receipt',()=>{
 const s=fixture();s.intakes[0].status='DISPATCHED';
 assert.deepEqual(planning(s).held.map(x=>x.reason),['OPERATION_NOT_PLANNED']);
 const k=fixture();k.intakes[0].remote_ref='urn:li:share:123';
 assert.deepEqual(planning(k).held.map(x=>x.reason),['POSSIBLE_REMOTE_SIDE_EFFECT']);
});

test('existing native brain_transition_operation CAS is independently read back before claiming review',async()=>{
 const packet=planning(fixture());const item=packet.work[0];
 let persisted=null,calls=[];
 const fetchImpl=async (url,options)=>{
   calls.push({url,method:options.method});
   if(url.endsWith('/rpc/brain_transition_operation')){
     const arg=JSON.parse(options.body);
     assert.equal(arg.p_operation_id,operationId);
     assert.equal(arg.p_expected_version,3);
     assert.equal(arg.p_status,'PLANNED');
     assert.equal(arg.p_remote_ref,null);
     assert.equal(arg.p_dispatch_generation,null);
     assert.equal(arg.p_evidence.original_agent_pre_review.consumer_ack_verified,false);
     assert.equal(arg.p_evidence.execution_resilience.side_effect_state,'NOT_STARTED');
     persisted={id:operationId,capability_id:item.capabilityId,operation_type:'INNOVATION_INTAKE',
       idempotency_key:item.idempotencyKey,payload_sha256:item.sourceSha256,
       change_id:item.changeId,correlation_id:item.correlationId,status:'PLANNED',version:4,
       remote_ref:null,evidence:arg.p_evidence};
     return {ok:true,json:async()=>persisted};
   }
   assert.ok(url.includes('/brain_operations?'));
   return {ok:true,json:async()=>[persisted]};
 };
 const result=await persistOriginalAgentPreReviews({plan:packet,config,fetchImpl});
 assert.equal(result.readback_proven,1);
 assert.equal(result.accepted_consumer_acks,0);
 assert.equal(result.implementations_verified,0);
 assert.equal(result.external_side_effects,0);
 assert.equal(calls.length,2);
 assert.equal(calls[0].method,'POST');
 assert.equal(calls[1].method,'GET');
});

test('uncertain CAS conflict cannot create duplicate work or manufacture a receipt',async()=>{
 const packet=planning(fixture()),item=packet.work[0];
 const withCurrent=async(fingerprint)=>{
  const fetchImpl=async (url)=>{
   if(url.endsWith('/rpc/brain_transition_operation'))return {ok:false,status:409};
   return {ok:true,json:async()=>[{
     id:item.operationId,capability_id:item.capabilityId,operation_type:'INNOVATION_INTAKE',
     idempotency_key:item.idempotencyKey,payload_sha256:item.sourceSha256,
     change_id:item.changeId,correlation_id:item.correlationId,status:'PLANNED',
     remote_ref:null,version:4,evidence:{original_agent_pre_review:{
       ...item.review,fingerprint}}}]};
  };
  return persistOriginalAgentPreReviews({plan:packet,config,fetchImpl});
 };
 assert.equal((await withCurrent(item.review.fingerprint)).already_registered,1);
 const rejected=await withCurrent('wrong');
 assert.equal(rejected.failed,1);
 assert.deepEqual(rejected.error_codes,['VERSION_OR_PROVIDER_CONFLICT']);
});

test('the same existing daily workflow consumes pre-review; no new cron, queue, sender, or false completion',()=>{
 const wf=readFileSync(' .github/workflows/powerhouse-daily-self-evolution.yml'.trim(),'utf8');
 const script=readFileSync('scripts/brain/innovation-original-agent-pre-review.mjs','utf8');
 assert.match(wf,/innovation-original-agent-pre-review\.mjs --writeback/);
 assert.match(wf,/innovation-original-owner-readback\.mjs/);
 assert.doesNotMatch(script,/cron\.schedule|new ParallelPublisher|return \{.*success:true/);
 assert.match(script,/p_status:'PLANNED'/);
 assert.match(script,/consumer_ack_verified:false/);
 assert.match(script,/readCanonicalRows\(/);
 assert.match(script,/evaluateOriginalOwnerHandoff\(/);
});
