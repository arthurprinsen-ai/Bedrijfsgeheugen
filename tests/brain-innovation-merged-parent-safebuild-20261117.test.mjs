import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  isVerifiedMergedHistoricalParentPr,selectOriginalCodeCandidate,CONTRACT
} from '../scripts/brain/innovation-original-code-delivery.mjs';

const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const id='55bb0754-355b-4940-aaea-aed7123e7e57';
const safePaths=[
  'platform/portal/powerhouse-existing-integration-read-model.mjs',
  'portal-v2/control-plane-cockpit.js'
];
const parent=()=>({
  number:5109,state:'MERGED',baseRefName:'main',
  mergedAt:'2026-10-29T12:39:27Z',
  mergeCommit:{oid:'a'.repeat(40)},
  files:[{path:'supabase/migrations/20261029122836_sales_cycle_execution_truth_guard_20261029.sql'},
    {path:'tests/brain-sales-action-execution-truth-20261029.test.mjs'}],
  body:'Obligation-ID: powerhouse-sales-action-execution-truth-20261029'
});
const candidate=()=>({
  candidate_id:id,component_id:'powerhouse-sales-cycle-execution-read-model',
  source_key:'quality-learning-v1:sales-cycle-legacy-execution-truth-projection-20261029',
  owner_agent:'engineering',status:'candidate',safety_class:'review_required',
  created_at:'2026-10-29T12:43:19.144537Z',
  proposed_action:{
    parent_pr:'5109',
    action:'Extend existing admin-only System Map read model to expose source-joined sales execution truth; do not rewrite old false-stage events and require independent production proof.'
  },
  rollback_plan:{rollback:'Revert the protected read-model-only change if source truth fails'}
});
function originalSource(){
  const c=candidate(),sha='f'.repeat(64),revision='actual-immutable-revision';
  const pre={
    original_owner:'agent:agent-integration-engineer',
    source_revision:revision,
    exact_source_action_digest:digest(c.proposed_action),
    exact_source_rollback_digest:digest(c.rollback_plan),
    consumer_ack_verified:false,external_side_effect:false
  };
  const decision={
    original_owner:pre.original_owner,source_revision:revision,source_sha256:sha,
    original_action_digest:digest(c.proposed_action),
    decision:'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
    actionable_work_package:true,
    production_mutation_authorized:false,consumer_ack_verified:false,
    fingerprint:'b'.repeat(64)
  };
  const obligation={business_entity:id,change_id:c.source_key,state:'OPEN',
    payload_sha256:sha,evidence:{source_revision:revision}};
  const operation={
    id:'b37f9278-6c04-49d0-8424-4517a538aabb',
    operation_type:'INNOVATION_INTAKE',
    capability_id:pre.original_owner,status:'PLANNED',remote_ref:null,
    version:6,change_id:c.source_key,payload_sha256:sha,
    correlation_id:'innovation-delivery:'+id,
    idempotency_key:'innovation-delivery:'+id+':'+sha.slice(0,16),
    evidence:{original_agent_pre_review:pre,original_owner_decision:decision}
  };
  return {snapshot:{candidates:[c],obligations:[obligation],intakes:[operation]},
    report:{contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',
      counts:{candidates:1,obligations:1,intakes:1}}};
}
test('old PR number alone must never authorize a new engineering writer',()=>{
  const f=originalSource();
  const res=selectOriginalCodeCandidate(f);
  assert.equal(res.selected,false);
  assert.equal(res.held,1);
});
test('historical provider merge, date and disjoint code scopes are all mandatory',()=>{
  const args={parentPr:5109,candidate:candidate(),allowedSourcePaths:safePaths};
  assert.equal(isVerifiedMergedHistoricalParentPr({...args,pr:parent()}),true);
  const invalid=[
    {...parent(),state:'OPEN'},
    {...parent(),baseRefName:'develop'},
    {...parent(),mergeCommit:null},
    {...parent(),number:9999},
    {...parent(),mergedAt:'2026-11-19T10:00:00Z'},
    {...parent(),files:[{path:safePaths[0]}]},
    {...parent(),files:[]},
    {...parent(),body:'Original-Candidate: '+id},
    {...parent(),files:[{path:'supabase/migrations/example.sql'},{path:safePaths[1]}]}
  ];
  for(const pr of invalid){
    assert.equal(isVerifiedMergedHistoricalParentPr({...args,pr}),false);
  }
  assert.equal(isVerifiedMergedHistoricalParentPr({...args,parentPr:'../../5109',pr:parent()}),false);
  assert.equal(isVerifiedMergedHistoricalParentPr({...args,
    candidate:{...candidate(),created_at:'2026-10-29T12:39:26Z'},pr:parent()}),false);
});
test('only verified prior merge unlocks a NEW bounded readmodel workorder',()=>{
  const f=originalSource(),observed=[];
  const allowed=selectOriginalCodeCandidate({...f,historicalParentFor:(n,c,paths)=>{
    observed.push({n,id:c.candidate_id,paths});
    return isVerifiedMergedHistoricalParentPr({
      pr:parent(),parentPr:n,candidate:c,allowedSourcePaths:paths
    });
  }});
  assert.equal(allowed.contract,CONTRACT);
  assert.equal(allowed.selected,true);
  assert.equal(allowed.candidate_id,id);
  assert.deepEqual(allowed.allowed_source_paths,safePaths);
  assert.equal(allowed.automatic_production_mutation,false);
  assert.equal(allowed.consumer_ack_verified,false);
  assert.deepEqual(observed,[{n:5109,id,paths:safePaths}]);
  assert.equal(selectOriginalCodeCandidate({...f,
    historicalParentFor:()=>true,
    existingPrFor:()=>true}).selected,false,'exact same-candidate PR still blocks duplicate');
});
test('old textual PR action, out-of-scope component, or prior Brain build stays held',()=>{
  const f=originalSource();
  f.snapshot.candidates[0].proposed_action.action='Protected PR5109: no duplicate SQL migration. Keep prior outcome immutable.';
  f.snapshot.intakes[0].evidence.original_agent_pre_review.exact_source_action_digest=
    digest(f.snapshot.candidates[0].proposed_action);
  f.snapshot.intakes[0].evidence.original_owner_decision.original_action_digest=
    digest(f.snapshot.candidates[0].proposed_action);
  assert.equal(selectOriginalCodeCandidate({...f,historicalParentFor:()=>true}).selected,false);
  f.snapshot.candidates[0].proposed_action=candidate().proposed_action;
  f.snapshot.intakes[0].evidence.original_agent_pre_review.exact_source_action_digest=
    digest(f.snapshot.candidates[0].proposed_action);
  f.snapshot.intakes[0].evidence.original_owner_decision.original_action_digest=
    digest(f.snapshot.candidates[0].proposed_action);
  f.snapshot.candidates[0].component_id='powerhouse-sales-cycle-truth';
  assert.equal(selectOriginalCodeCandidate({...f,historicalParentFor:()=>true}).selected,false);
  f.snapshot.candidates[0].component_id=candidate().component_id;
  f.snapshot.intakes[0].evidence.original_code_candidate_pr={
    candidate_id:id,source_revision:'actual-immutable-revision',
    source_sha256:'f'.repeat(64)
  };
  assert.equal(selectOriginalCodeCandidate({...f,historicalParentFor:()=>true}).selected,false);
});


test('same original candidate protected source proof prevents historical-parent rebuild',()=>{
  const f=originalSource();
  const op=f.snapshot.intakes[0];
  op.evidence.protected_implementation_source_evidence={
    contract:'ORIGINAL_ENGINEERING_IMPLEMENTATION_EVIDENCE_V1',
    candidate_id:id,
    original_owner:'agent:agent-integration-engineer',
    source_revision:'actual-immutable-revision',
    pr_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857',
    protected_release_verified:true
  };
  const result=selectOriginalCodeCandidate({...f,
    historicalParentFor:()=>{throw new Error('CANNOT_BUILD_ALREADY_IMPLEMENTED');}
  });
  assert.equal(result.selected,false);
  assert.equal(result.held,1);
  assert.equal(result.reason,'NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE');
  for(const bad of [
    {source_revision:'wrong-revision'},
    {original_owner:'agent:some-other-agent'},
    {candidate_id:'f'.repeat(36)},
    {protected_release_verified:false},
    {pr_url:'https://evil.example/pull/5857'}
  ]){
    op.evidence.protected_implementation_source_evidence={
      ...op.evidence.protected_implementation_source_evidence,...bad
    };
    assert.throws(()=>selectOriginalCodeCandidate({...f,historicalParentFor:()=>true}),
      /ORIGINAL_PRIOR_PROTECTED_IMPLEMENTATION_CONFLICT/);
    op.evidence.protected_implementation_source_evidence={
      contract:'ORIGINAL_ENGINEERING_IMPLEMENTATION_EVIDENCE_V1',
      candidate_id:id,original_owner:'agent:agent-integration-engineer',
      source_revision:'actual-immutable-revision',
      pr_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857',
      protected_release_verified:true
    };
  }
});
