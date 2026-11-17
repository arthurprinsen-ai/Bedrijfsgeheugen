import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  classifyVerifiedOriginalParentPr,selectOriginalCodeCandidate,CONTRACT
} from '../scripts/brain/innovation-original-code-delivery.mjs';

const ID='55bb0754-355b-4940-aaea-aed7123e7e57';
const SOURCE='quality-learning-v1:sales-cycle-legacy-execution-truth-projection-20261029';
const REV='2026-10-29T12:43:19.144537+00:00';
const HASH='a'.repeat(64),MERGE='c'.repeat(40),MAIN='d'.repeat(40);
const OWNER='agent:agent-integration-engineer';
const SCOPE=['platform/portal/powerhouse-existing-integration-read-model.mjs','portal-v2/control-plane-cockpit.js'];
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

function parentPr(patch={}){
 return {number:5109,url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5109',
   state:'MERGED',baseRefName:'main',mergeCommit:{oid:MERGE},
   body:'Parent-P0: #4198\nCandidate-Type: implementation\nObligation-ID: powerhouse-sales-action-execution-truth-20261029',
   files:[{path:'supabase/migrations/20261029122836_sales_cycle_execution_truth_guard_20261029.sql'}],
   ...patch};
}
const compare={status:'ahead',merge_base_commit:{sha:MERGE}};
const proof=()=>classifyVerifiedOriginalParentPr({
 parentPr:5109,pr:parentPr(),mainSha:MAIN,compare,childId:ID,childAllowedSourcePaths:SCOPE
});
function scenario(){
 const action={action:'Extend the existing admin-only System Map read model to show source-joined execution truth; timestamped executed actions must be distinguished from unsupported legacy cycle stage events, without rewriting history or bypassing protected review.',
   parent_pr:5109,writer:'existing',scheduler:'existing'};
 const rollback={strategy:'revert only future read-model presentation through protected source commit; preserve original events'};
 const c={candidate_id:ID,component_id:'powerhouse-sales-cycle-execution-read-model',
   source_key:SOURCE,owner_agent:'engineering',safety_class:'review_required',status:'candidate',
   created_at:'2026-10-29T12:43:19Z',proposed_action:action,rollback_plan:rollback};
 const o={business_entity:ID,change_id:SOURCE,owner:'original-agent:engineering',
   state:'OPEN',payload_sha256:HASH,evidence:{source_revision:REV}};
 const op={id:'edebcb32-335b-49f0-b527-eb4289f95c5c',
   operation_type:'INNOVATION_INTAKE',capability_id:OWNER,status:'PLANNED',remote_ref:null,version:2,
   change_id:SOURCE,payload_sha256:HASH,correlation_id:'innovation-delivery:'+ID,
   idempotency_key:'innovation-delivery:'+ID+':'+HASH.slice(0,16),
   evidence:{
     original_agent_pre_review:{original_owner:OWNER,source_revision:REV,
       exact_source_action_digest:digest(action),exact_source_rollback_digest:digest(rollback),
       consumer_ack_verified:false,external_side_effect:false},
     original_owner_decision:{original_owner:OWNER,source_revision:REV,source_sha256:HASH,
       original_action_digest:digest(action),decision:'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
       actionable_work_package:true,production_mutation_authorized:false,
       consumer_ack_verified:false,fingerprint:'b'.repeat(64)}
   }};
 return {snapshot:{candidates:[c],obligations:[o],intakes:[op]},
   report:{contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',
     counts:{candidates:1,obligations:1,intakes:1}}};
}
test('native parent proof binds independent protected main ancestry and disjoint child source',()=>{
 const p=proof();assert.ok(p);
 assert.equal(p.parent_pr,5109);assert.equal(p.original_candidate_id,ID);
 assert.equal(p.source_paths_disjoint,true);assert.equal(p.protected_main_ancestor,true);
 assert.equal(p.child_implementation_proven,false);assert.equal(p.child_consumer_ack_verified,false);
});
test('unmerged, untrusted, overlapping or wrong-parent provider data are never accepted',()=>{
 const a={parentPr:5109,mainSha:MAIN,compare,childId:ID,childAllowedSourcePaths:SCOPE};
 const wrong=[
   {...a,pr:parentPr({state:'OPEN'})},
   {...a,pr:parentPr({baseRefName:'feature'})},
   {...a,pr:parentPr({url:'https://github.com/attacker/other/pull/5109'})},
   {...a,pr:parentPr({files:[{path:SCOPE[0]}]})},
   {...a,pr:parentPr({body:'Candidate-Type: implementation\nOriginal-Candidate: '+ID})},
   {...a,pr:parentPr({body:'Candidate-Type: recovery'})},
   {...a,pr:parentPr({mergeCommit:{oid:'bad'}})},
   {...a,pr:parentPr({number:5108})},
   {...a,compare:{status:'diverged',merge_base_commit:{sha:MERGE}}},
   {...a,compare:{status:'ahead',merge_base_commit:{sha:'f'.repeat(40)}}},
   {...a,mainSha:'unknown'},
   {...a,parentPr:'5109'}
 ];
 for(const candidate of wrong)assert.equal(classifyVerifiedOriginalParentPr(candidate),null);
});
test('old explicit parent is held when not independently proven, not mistaken for a duplicate when proven',()=>{
 const s=scenario();
 const held=selectOriginalCodeCandidate(s);
 assert.equal(held.selected,false);assert.equal(held.terminal_success,false);
 let called=false;
 const eligible=selectOriginalCodeCandidate({...s,verifiedParentFor:(n,x)=>{
   called=true;assert.equal(n,5109);assert.equal(x.candidateId,ID);
   assert.deepEqual(x.allowedSourcePaths,SCOPE);return proof();
 }});
 assert.equal(called,true);
 assert.equal(eligible.contract,CONTRACT);
 assert.equal(eligible.selected,true);assert.equal(eligible.candidate_id,ID);
 assert.deepEqual(eligible.verified_parent_pr,proof());
 assert.equal(eligible.candidate_pr_only,true);
 assert.equal(eligible.automatic_production_mutation,false);
 assert.equal(eligible.consumer_ack_verified,false);
});
test('proven parent never bypasses child exact-source PR dedupe or source drift',()=>{
 const s=scenario();
 const duplicate=selectOriginalCodeCandidate({...s,verifiedParentFor:proof,
   existingPrFor:(id,sha,rev)=>id===ID&&sha===HASH&&rev===REV});
 assert.equal(duplicate.selected,false);assert.equal(duplicate.existing,1);
 for(const broken of [
   {...proof(),parent_pr:5108},
   {...proof(),source_paths_disjoint:false},
   {...proof(),child_implementation_proven:true},
   {...proof(),protected_main_ancestor:false},
   {...proof(),merge_sha:'bad'}
 ])assert.equal(selectOriginalCodeCandidate({...s,verifiedParentFor:()=>broken}).selected,false);
 s.snapshot.intakes[0].payload_sha256='f'.repeat(64);
 assert.throws(()=>selectOriginalCodeCandidate({...s,verifiedParentFor:proof}),/SOURCE_BINDING_INCOMPLETE/);
});
test('parent exception is limited to the one source-owned sales read-model route',()=>{
 const s=scenario();
 s.snapshot.candidates[0].component_id='powerhouse-decision-cycle-evidence';
 assert.equal(selectOriginalCodeCandidate({...s,verifiedParentFor:proof}).selected,false);
});
test('provider-native GitHub source lookup is required in the actual original writer',()=>{
 const src=readFileSync('scripts/brain/innovation-original-code-delivery.mjs','utf8');
 assert.match(src,/function verifiedOriginalParentFor/);
 assert.match(src,/verifiedParentFor:verifiedOriginalParentFor/);
 assert.match(src,/compare\/.*mergeCommit/);
 assert.match(src,/parent_is_not_child_implementation/);
 assert.match(src,/child_implementation_proven:false/);
 assert.match(src,/NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE/);
});
