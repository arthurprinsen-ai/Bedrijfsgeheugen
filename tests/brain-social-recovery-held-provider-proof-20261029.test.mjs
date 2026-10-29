import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldRecoverHeldPersonalDuplicate,evaluateSocialDayProviderProof} from '../supabase/functions/_shared/social-recovery-proof-contract.mjs';

const hold=[{channel:'linkedin_personal',decision:'hold',state:'blocked',delivery_ref:null,delivery_evidence:{}}];
const blocked=[{channel:'linkedin_personal',status:'BLOCKED',last_error:'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE',external_id:null,evidence:{
  global_uniqueness_gate:'blocked',publication_authority:{issued:true,consumed:false}}}];

test('pre-provider duplicate HOLD routes to same content-loop, not a second writer',()=>{
  assert.equal(shouldRecoverHeldPersonalDuplicate(hold,blocked),true);
  assert.equal(shouldRecoverHeldPersonalDuplicate(hold,[]),false);
});
test('never rebootstrap a possibly posted, consumed or identity-uncertain duplicate',()=>{
  assert.equal(shouldRecoverHeldPersonalDuplicate(hold,[{...blocked[0],external_id:'urn:li:share:already'}]),false);
  assert.equal(shouldRecoverHeldPersonalDuplicate(hold,[{...blocked[0],evidence:{...blocked[0].evidence,possible_provider_side_effect:true}}]),false);
  assert.equal(shouldRecoverHeldPersonalDuplicate(hold,[{...blocked[0],evidence:{...blocked[0].evidence,publication_authority:{issued:true,consumed:true}}}]),false);
  assert.equal(shouldRecoverHeldPersonalDuplicate([{...hold[0],delivery_evidence:{provider_create_success:true}}],blocked),false);
});
const proven=channel=>({channel,status:'LIVE_PROVEN',external_id:'provider-real-'+channel,evidence:{provider_truth_verified:true}});
test('all three social channels need exact provider IDs and independent readback',()=>{
  const good=['linkedin_personal','linkedin_company','instagram'].map(proven);
  assert.deepEqual(evaluateSocialDayProviderProof(good),{ok:true,unresolved:[]});
  const withHold=[...good.slice(0,1),{channel:'linkedin_company',status:'BLOCKED',external_id:null},good[2]];
  assert.equal(evaluateSocialDayProviderProof(withHold).ok,false);
  assert.deepEqual(evaluateSocialDayProviderProof(withHold).unresolved.map(x=>x.channel),['linkedin_company']);
});
test('provider ack or stale published state never proves public social completion',()=>{
  const rows=['linkedin_personal','linkedin_company','instagram'].map(proven);
  rows[0]={...rows[0],status:'PUBLISHED'};
  assert.equal(evaluateSocialDayProviderProof(rows).ok,false);
  rows[0]={...rows[0],status:'LIVE_PROVEN',evidence:{provider_publication_ack_verified:true}};
  assert.equal(evaluateSocialDayProviderProof(rows).unresolved[0].missing_independent_readback,true);
  rows[0]={...rows[0],external_id:null,evidence:{provider_truth_verified:true}};
  assert.equal(evaluateSocialDayProviderProof(rows).unresolved[0].missing_provider_id,true);
});
test('every eligible channel remains due even when decision not publish',()=>{
  assert.equal(evaluateSocialDayProviderProof([proven('linkedin_company')]).unresolved.length,2);
  assert.equal(evaluateSocialDayProviderProof([]).unresolved.length,3);
});
