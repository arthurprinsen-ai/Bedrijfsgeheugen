import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canRecoverExpiredCompanyClaim,canRecoverExpiredPersonalClaim}
 from '../supabase/functions/_shared/social-publish-claim-recovery.mjs';

const mk=(channel)=>({
 runDate:'2026-10-22',currentDate:'2026-10-22',nowMs:Date.parse('2026-10-22T09:32:00Z'),
 decision:{channel,decision:'publish',state:'blocked',delivery_ref:null,
  delivery_evidence:{error:'PUBLICATION_AUTHORITY_DENIED:DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED'}},
 obligation:{channel,status:'BLOCKED',external_id:null,live_proven_at:null,
  evidence:{provider_create_success:false,provider_publication_ack_verified:false,
    possible_provider_side_effect:false,republish_forbidden:false,provider_truth_verified:false}},
 capabilities:[
  {expires_at:'2026-10-22T09:14:51Z',consumed_at:null,revoked_at:'2026-10-22T09:15:08Z'},
  {expires_at:'2026-10-22T09:20:08Z',consumed_at:null,revoked_at:null}
 ],reservations:[]
});
test('both LinkedIn identities can resume only original fully expired unsent claim',()=>{
 for(const ch of ['linkedin_personal','linkedin_company']){
  const verify=ch==='linkedin_personal'?canRecoverExpiredPersonalClaim:canRecoverExpiredCompanyClaim;
  assert.deepEqual(verify(mk(ch)),{authorized:true,reason:'EXPIRED_UNCONSUMED_LEASE_NO_PROVIDER_EFFECT'});
 }
});
test('never revive personal from consumed, future, blocked proof, or unique claim',()=>{
 const f=canRecoverExpiredPersonalClaim, orig=mk('linkedin_personal');
 assert.equal(f({...orig,currentDate:'2026-10-23'}).authorized,false);
 assert.equal(f({...orig,reservations:[{id:'already-posted'}]}).authorized,false);
 assert.equal(f({...orig,capabilities:[{expires_at:'2026-10-22T09:44:00Z',consumed_at:null,revoked_at:null}]}).authorized,false);
 assert.equal(f({...orig,capabilities:[{expires_at:'2026-10-22T09:11:00Z',consumed_at:'2026-10-22T09:11:01Z',revoked_at:null}]}).authorized,false);
 for(const flag of ['provider_create_success','provider_publication_ack_verified','possible_provider_side_effect','republish_forbidden','provider_truth_verified']){
   assert.equal(f({...orig,obligation:{...orig.obligation,evidence:{...orig.obligation.evidence,[flag]:true}}}).authorized,false,flag);
 }
 assert.equal(f({...orig,obligation:{...orig.obligation,evidence:{...orig.obligation.evidence,possible_provider_side_effect:null}}}).authorized,false);
 assert.equal(f({...orig,decision:{...orig.decision,delivery_ref:'urn:li:share:5'}}).authorized,false);
 assert.equal(f({...orig,obligation:{...orig.obligation,external_id:'urn:li:share:5'}}).authorized,false);
});
test('cannot use personal lease to restore company or other blocked content',()=>{
 assert.equal(canRecoverExpiredCompanyClaim(mk('linkedin_personal')).authorized,false);
 assert.equal(canRecoverExpiredPersonalClaim(mk('linkedin_company')).authorized,false);
 const a=mk('linkedin_personal');
 assert.equal(canRecoverExpiredPersonalClaim({...a,decision:{...a.decision,delivery_evidence:{error:'GLOBAL_POST_DUPLICATE_BLOCKED'}}}).authorized,false);
});
test('production publisher uses single existing recovery and exact race-safe CAS',()=>{
 const s=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 assert.match(s,/recoverExpiredLinkedInPublicationAuthority\(db,runDate,channels\)/);
 assert.match(s,/canRecoverExpiredPersonalClaim/);
 assert.match(s,/\.is\('consumed_at',null\)\.is\('revoked_at',null\)/);
 assert.match(s,/\.lte\('expires_at',now\)/);
 assert.match(s,/\.is\('delivery_ref',null\)/);
 assert.match(s,/\.eq\('state','blocked'\)/);
 assert.match(s,/issuePublishCapability\(/);
 assert.match(s,/consumePublishCapability\(/);
});
