import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {selectOriginalCodeCandidate,checkChangedPaths,CONTRACT} from '../scripts/brain/innovation-original-code-delivery.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id='2c1ecc77-58aa-4f25-ae68-e2337853fdc7';
const payload='a'.repeat(64);
const revision='source-rev-20261115';
function fixture(){
  const proposed_action={action:'Extend existing authorized runtime writers to carry real actor, skill, source and before after evidence into canonical cycle events with privacy-safe readback.'};
  const rollback_plan={rollback:'revert through protected delivery'};
  const candidate={candidate_id:id,source_key:'quality-learning-v1:runtime',component_id:'powerhouse-decision-cycle-evidence',
    owner_agent:'engineering',status:'candidate',safety_class:'review_required',created_at:'2026-10-29T10:00:00Z',
    proposed_action,rollback_plan};
  const obligation={business_entity:id,change_id:candidate.source_key,state:'OPEN',
    payload_sha256:payload,evidence:{source_revision:revision}};
  const pre={original_owner:'agent:agent-integration-engineer',source_revision:revision,
    exact_source_action_digest:hash(proposed_action),exact_source_rollback_digest:hash(rollback_plan),
    consumer_ack_verified:false,external_side_effect:false};
  const decision={original_owner:pre.original_owner,source_revision:revision,source_sha256:payload,
    original_action_digest:hash(proposed_action),decision:'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
    actionable_work_package:true,production_mutation_authorized:false,
    consumer_ack_verified:false,fingerprint:'b'.repeat(64)};
  const op={id:'b37f9278-6c04-49d0-8424-4517a538aabb',operation_type:'INNOVATION_INTAKE',
    capability_id:pre.original_owner,status:'PLANNED',version:4,remote_ref:null,
    change_id:candidate.source_key,payload_sha256:payload,
    correlation_id:'innovation-delivery:'+id,
    idempotency_key:'innovation-delivery:'+id+':'+payload.slice(0,16),
    evidence:{original_agent_pre_review:pre,original_owner_decision:decision}};
  const snapshot={candidates:[candidate],obligations:[obligation],intakes:[op]};
  const report={contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',
    counts:{candidates:1,obligations:1,intakes:1}};
  return {snapshot,report};
}
test('source-bound original engineering decision selects one candidate without claiming deployment',()=>{
  const result=selectOriginalCodeCandidate(fixture());
  assert.equal(result.contract,CONTRACT);
  assert.equal(result.selected,true);
  assert.equal(result.candidate_id,id);
  assert.equal(result.automatic_production_mutation,false);
  assert.equal(result.consumer_ack_verified,false);
  assert.deepEqual(result.allowed_source_paths,[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'platform/system-map/canonical-system-map.mjs'
  ]);
});
test('already recorded GitHub candidate is not regenerated',()=>{
  const result=selectOriginalCodeCandidate({...fixture(),existingPrFor:x=>x===id});
  assert.equal(result.selected,false);
  assert.equal(result.existing,1);
});
test('original owner decision cannot silently bypass source identity',()=>{
  const o=fixture();o.snapshot.intakes[0].payload_sha256='f'.repeat(64);
  assert.throws(()=>selectOriginalCodeCandidate(o),/SOURCE_BINDING_INCOMPLETE/);
});
test('pre-review mismatch cannot be turned into green',()=>{
  const o=fixture();o.snapshot.intakes[0].evidence.original_agent_pre_review.source_revision='stale';
  assert.throws(()=>selectOriginalCodeCandidate(o),/PRE_REVIEW_CONFLICT/);
});
test('read-only proposal with old PR reference is held, not rebuilt',()=>{
  const o=fixture();o.snapshot.candidates[0].proposed_action.parent_pr=5109;
  const actionHash=hash(o.snapshot.candidates[0].proposed_action);
  o.snapshot.intakes[0].evidence.original_agent_pre_review.exact_source_action_digest=actionHash;
  o.snapshot.intakes[0].evidence.original_owner_decision.original_action_digest=actionHash;
  assert.equal(selectOriginalCodeCandidate(o).selected,false);
});
test('bounded diff rejects workflow, destructive paths, tests-only and fake learning',()=>{
  const workorder=selectOriginalCodeCandidate(fixture());
  const okay=[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'tests/brain-innovation-autonomous-build-20261115.test.mjs',
    'brain/learning/2026-11-15-innovation-engineering-code-v1.json'
  ];
  assert.equal(checkChangedPaths({workorder,changed:okay}).source.length,1);
  for(const bad of ['.github/workflows/powerhouse-daily-self-evolution.yml',
    'supabase/migrations/20261115000000_unsafe.sql','AGENTS.md']){
    assert.throws(()=>checkChangedPaths({workorder,changed:[...okay,bad]}),/PATH_SCOPE/);
  }
  assert.throws(()=>checkChangedPaths({workorder,changed:okay,deleted:[okay[0]]}),/DELETION_FORBIDDEN/);
  assert.throws(()=>checkChangedPaths({workorder,changed:okay.slice(1)}),/PATH_SCOPE/);
});
