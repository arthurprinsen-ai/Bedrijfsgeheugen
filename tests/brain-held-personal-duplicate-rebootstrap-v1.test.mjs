import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shouldRebootstrapHeldPersonalDuplicate as should} from '../supabase/functions/_shared/held-personal-duplicate-rebootstrap.mjs';

const decision={channel:'linkedin_personal',decision:'hold',state:'blocked',
  delivery_ref:null,delivery_evidence:{rejected_recommendation_ids:['original']}};
const obligation={channel:'linkedin_personal',status:'BLOCKED',
  last_error:'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE',
  external_id:null,recovery_attempts:1,evidence:{
    global_uniqueness_gate:'blocked',publication_authority:{issued:true,consumed:false},
    rejected_recommendation_ids:['original'],personal_source_recommendation_id:'original',
    provider_create_success:false,possible_provider_side_effect:false,republish_forbidden:false
  }};
const original={recommendation_id:'original',dedupe_key:'ai-native-builder-linkedin-personal:2026-10-22',status:'suggested'};
const reserve={recommendation_id:'fresh',dedupe_key:'founder-proof-reserve:2026-10-22:observed_progress',status:'suggested'};

test('canonical held duplicate reopens once to materialize bounded alternatives',()=>{
 assert.equal(should(decision,obligation,[original],'2026-10-22'),true);
 assert.equal(should(decision,{...obligation,recovery_attempts:3},[original],'2026-10-22'),false);
 assert.equal(should(decision,obligation,[original,reserve],'2026-10-22'),true);
 assert.equal(should(decision,{...obligation,evidence:{...obligation.evidence,rejected_recommendation_ids:['original','fresh']}},[original,reserve],'2026-10-22'),false);
});
test('forbids all attempted, ambiguous, consumed or published provider effects',()=>{
 assert.equal(should({...decision,delivery_ref:'urn:li:share:123'},obligation,[reserve],'2026-10-22'),false);
 assert.equal(should({...decision,delivery_evidence:{provider_create_success:true}},obligation,[reserve],'2026-10-22'),false);
 assert.equal(should(decision,{...obligation,external_id:'urn:li:share:123'},[reserve],'2026-10-22'),false);
 for(const field of ['provider_create_success','possible_provider_side_effect','republish_forbidden','provider_truth_verified','provider_publication_ack_verified']){
   assert.equal(should(decision,{...obligation,evidence:{...obligation.evidence,[field]:true}},[reserve],'2026-10-22'),false,field);
 }
 assert.equal(should(decision,{...obligation,evidence:{...obligation.evidence,publication_authority:{issued:true,consumed:true}}},[reserve],'2026-10-22'),false);
 assert.equal(should({...decision,decision:'publish'},obligation,[reserve],'2026-10-22'),false);
});
test('no unsafe replay on unrelated or exhausted publication claims',()=>{
 assert.equal(should({...decision,channel:'linkedin_company'},obligation,[reserve],'2026-10-22'),false);
 assert.equal(should(decision,{...obligation,last_error:'PERSONAL_SOURCE_UNVERIFIED'},[reserve],'2026-10-22'),false);
 assert.equal(should(decision,obligation,[{...reserve,status:'rejected'}],'2026-10-22'),true);
 assert.equal(should(decision,{...obligation,recovery_attempts:3},[original],'2026-10-22'),false);
});
test('existing content loop calls original bootstrap, never a second scheduler',()=>{
 const loop=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
 assert.match(loop,/retryableContentBlock \|\| retryableHeldPersonalDuplicate/);
 assert.match(loop,/shouldRebootstrapHeldPersonalDuplicate\(/);
 assert.match(loop,/powerhouse-content-orchestrator:bootstrap/);
 assert.match(loop,/powerhouse_content_recommendations/);
 assert.doesNotMatch(loop,/PowerhouseSecondaryScheduler/);
});
