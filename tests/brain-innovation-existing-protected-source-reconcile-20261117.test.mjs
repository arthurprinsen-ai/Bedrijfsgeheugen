import test from 'node:test';
import assert from 'node:assert/strict';
import {examineOriginalDelivery,planOriginalContinuity}
  from '../scripts/brain/innovation-original-delivery-continuity.mjs';

const id='55bb0754-355b-4940-aaea-aed7123e7e57';
const source='quality-learning-v1:sales-cycle-legacy-execution-truth-projection-20261029';
const revision='2026-10-29T12:43:19.144537+00:00';
const digest='a6998858af05338ddba6cd7ecb90ecbb9d08373688258d4ddb874b4bbc445855';
const owner='agent:agent-integration-engineer';
const merge='875244148e910e43928a11221f6e75496f491ebb';
function sourceFixture(){
 const candidate={candidate_id:id,component_id:'powerhouse-sales-cycle-execution-read-model',
   source_key:source,owner_agent:'engineering'};
 const obligation={business_entity:id,change_id:source,owner:'original-agent:engineering',
   payload_sha256:digest,state:'OPEN',evidence:{source_revision:revision}};
 const operation={id:'edebcb32-335b-49f0-b527-eb4289f95c5c',
   status:'PLANNED',remote_ref:null,operation_type:'INNOVATION_INTAKE',
   capability_id:owner,change_id:source,payload_sha256:digest,
   correlation_id:'innovation-delivery:'+id,
   idempotency_key:'innovation-delivery:'+id+':'+digest.slice(0,16),
   evidence:{original_owner_decision:{
     original_owner:owner,source_sha256:digest,source_revision:revision,
     decision:'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE'},
     protected_implementation_source_evidence:{
       contract:'ORIGINAL_ENGINEERING_IMPLEMENTATION_EVIDENCE_V1',
       candidate_id:id,original_owner:owner,source_revision:revision,
       implementation_scope:'readonly_original_sales_action_full_week_census',
       protected_release_verified:true,
       pr_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857'
     }}};
 return {candidate,obligation,operation};
}
const legacy=()=>({number:5857,
 url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857',
 state:'MERGED',baseRefName:'main',mergeCommit:{oid:merge},
 body:'Parent-P0: #4198\nCandidate-Type: implementation\nWriter-Lease-Owner: original agent:agent-integration-engineer / existing Powerhouse admin source-joined readback\nOriginal candidate `'+id+'` was protected deployed'});
const measured=(adjust={})=>({readOnly:true,
 externalProviderProof:false,paidOutcomeProof:false,
 scope:'FULL_LAST_7D',state:'HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED',
 totalEvents7d:165,sampledEvents:165,actionBackedSample:165,unsupportedSample:0,
 missingActionSample:0,currentActionNotDoneSample:0,currentExecutionWithoutEventSample:0,
 observedAt:'2026-11-17T20:10:00Z',...adjust});
const clock='2026-11-17T20:10:15Z';
test('existing protected code is NOT described as missing build when exact original source evidence exists',()=>{
 const a=examineOriginalDelivery({...sourceFixture(),checkedAt:clock});
 assert.equal(a.stage,'PREEXISTING_PROTECTED_SOURCE_NATIVE_PR_READBACK_DUE');
 assert.equal(a.existing_protected_source_pr_verified,false);
 assert.equal(a.verified_code_in_production,false);
 assert.equal(a.actual_impact,null);
 assert.equal(a.terminal_success,false);
});
test('native merged PR without current independent provider audit remains unmeasured',()=>{
 const a=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),checkedAt:clock});
 assert.equal(a.stage,'PREEXISTING_PROTECTED_SOURCE_CURRENT_PROVIDER_AUDIT_DUE');
 assert.equal(a.existing_protected_source_pr_verified,true);
 assert.equal(a.internal_source_readback,null);
 assert.equal(a.independent_impact_verified,false);
});
test('fresh complete bounded provider source join is recorded, but never misrepresented as external sale or causal value',()=>{
 const a=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),sourceAudit:measured(),checkedAt:clock});
 assert.equal(a.stage,'PREEXISTING_SOURCE_CURRENTLY_MEASURED_CAUSAL_OUTCOME_DUE');
 assert.equal(a.internal_source_readback.total_internal_execution_events_7d,165);
 assert.equal(a.internal_source_readback.writer_action_joined,165);
 assert.equal(a.internal_source_readback.unsupported_internal_events,0);
 assert.equal(a.internal_source_readback.independent_provider_send_verified,false);
 assert.equal(a.internal_source_readback.independent_revenue_or_customer_value_verified,false);
 assert.equal(a.verified_code_in_production,false,'no fresh native Netlify deployed-commit identity was checked');
 assert.equal(a.consumer_ack_verified,false);
 assert.equal(a.independent_heartbeat_learning_verified,false);
 assert.equal(a.terminal_success,false);
});
test('internal source-gap and zero-event audits remain due rather than turning green',()=>{
 const gap=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),sourceAudit:measured({
   state:'SOURCE_EXECUTION_GAP',actionBackedSample:164,unsupportedSample:1}),checkedAt:clock});
 assert.equal(gap.stage,'PREEXISTING_SOURCE_GAPS_REQUIRE_ORIGINAL_OWNER_REPAIR');
 const none=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),sourceAudit:measured({
   state:'NO_EXECUTION_EVENTS_OBSERVED',totalEvents7d:0,sampledEvents:0,
   actionBackedSample:0,unsupportedSample:0}),checkedAt:clock});
 assert.equal(none.stage,'PREEXISTING_SOURCE_NO_CURRENT_EVENTS_MEASUREMENT_DUE');
 assert.equal(none.actual_impact,null);
});
test('wrong native PR or source identity fails closed',()=>{
 const f=sourceFixture();
 for(const wrong of [
   {url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5858'},
   {body:legacy().body.replace(id,'f'.repeat(36))},
   {baseRefName:'feature'}]){
  assert.throws(()=>examineOriginalDelivery({...f,legacyPr:{...legacy(),...wrong},checkedAt:clock}),
    /LEGACY_GITHUB_PR_LINEAGE_CONFLICT/);
 }
 f.operation.evidence.protected_implementation_source_evidence.source_revision='stale';
 assert.throws(()=>examineOriginalDelivery({...f,legacyPr:legacy(),checkedAt:clock}),
   /LEGACY_IMPLEMENTATION_SOURCE_IDENTITY_CONFLICT/);
});
test('partial over-cap, stale, or fabricated paid results cannot count as fresh source measurement',()=>{
 for(const a of [measured({scope:'ABOVE_500_FAIL_CLOSED'}),
   measured({observedAt:'2026-11-15T12:00:00Z'}),
   measured({readOnly:false}),
   measured({paidOutcomeProof:true}),
   measured({sampledEvents:100}),
   measured({actionBackedSample:170})]){
  const s=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),sourceAudit:a,checkedAt:clock});
  assert.equal(s.stage,'PREEXISTING_PROTECTED_SOURCE_CURRENT_PROVIDER_AUDIT_DUE');
  assert.equal(s.internal_source_readback,null);
  assert.equal(s.terminal_success,false);
 }
});
test('stable count and provider state gives idempotent original CAS fingerprint even across repeated clock times',()=>{
 const a=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),sourceAudit:measured(),checkedAt:clock});
 const b=examineOriginalDelivery({...sourceFixture(),legacyPr:legacy(),sourceAudit:measured({
   observedAt:'2026-11-17T20:25:00Z'}),checkedAt:'2026-11-17T20:25:15Z'});
 assert.equal(a.assessment_fingerprint,b.assessment_fingerprint);
});
test('same original 1:1 source-owner-brain packet accepts existing implementation path without a duplicate executor',()=>{
 const f=sourceFixture();
 const snapshot={candidates:[f.candidate],obligations:[f.obligation],intakes:[f.operation]};
 const report={contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',
   counts:{candidates:1,obligations:1,intakes:1}};
 const result=planOriginalContinuity({snapshot,report,
   legacyPrByCandidate:{[id]:legacy()},sourceAuditByCandidate:{[id]:measured()},checkedAt:clock});
 assert.equal(result.length,1);
 assert.equal(result[0].operation.id,f.operation.id);
 assert.equal(result[0].assessment.internal_source_readback.writer_action_joined,165);
 assert.equal(result[0].assessment.original_state_remains,'PLANNED');
});


test('real original no-change Codex receipt never erases a historically protected implementation and fresh source measurement',()=>{
 const f=sourceFixture();
 f.operation.evidence.original_code_nochange_review={
   result:'NO_SOURCE_CHANGE_REQUIRES_INDEPENDENT_REVIEW',
   contract:'ORIGINAL_INNOVATION_NO_CODE_CHANGE_REVIEW_V1',
   observed_at:'2026-11-17T20:30:48Z',candidate_id:id,
   source_revision:revision,source_sha256:digest,
   original_owner:owner,implementation_verified:false,
   consumer_ack_verified:false,terminal_success:false
 };
 const withNative=examineOriginalDelivery({...f,legacyPr:legacy(),
   sourceAudit:measured(),checkedAt:clock});
 assert.equal(withNative.stage,'PREEXISTING_SOURCE_CURRENTLY_MEASURED_CAUSAL_OUTCOME_DUE');
 assert.equal(withNative.internal_source_readback.writer_action_joined,165);
 assert.equal(withNative.existing_protected_source_pr_verified,true);
 assert.equal(withNative.terminal_success,false);
 assert.equal(withNative.consumer_ack_verified,false);
 assert.equal(withNative.actual_impact,null);
 // Keep immutable original nochange evidence; never manufacture another build.
 assert.equal(f.operation.evidence.original_code_nochange_review.result,'NO_SOURCE_CHANGE_REQUIRES_INDEPENDENT_REVIEW');
 const noNative=examineOriginalDelivery({...f,checkedAt:clock});
 assert.equal(noNative.stage,'PREEXISTING_PROTECTED_SOURCE_NATIVE_PR_READBACK_DUE');
 f.operation.evidence.original_code_nochange_review.source_revision='CORRUPT';
 assert.throws(()=>examineOriginalDelivery({...f,legacyPr:legacy(),
   sourceAudit:measured(),checkedAt:clock}),/NOCHANGE_SOURCE_CONFLICT/);
});
