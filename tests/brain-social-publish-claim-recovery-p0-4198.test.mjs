import assert from 'node:assert/strict';
import test from 'node:test';
import {canRecoverExpiredCompanyClaim} from '../supabase/functions/_shared/social-publish-claim-recovery.mjs';

const base = () => ({
  runDate:'2026-10-11',currentDate:'2026-10-11',nowMs:Date.parse('2026-10-11T13:00:00Z'),
  decision:{channel:'linkedin_company',decision:'publish',state:'blocked',delivery_ref:null,
    delivery_evidence:{error:'PUBLICATION_AUTHORITY_DENIED:DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED'}},
  obligation:{channel:'linkedin_company',status:'BLOCKED',external_id:null,live_proven_at:null,
    evidence:{provider_create_success:false,provider_publication_ack_verified:false,possible_provider_side_effect:false}},
  capabilities:[{capability_id:'a',expires_at:'2026-10-11T10:00:00Z',consumed_at:null,revoked_at:null}],
  reservations:[]
});
test('recovers original expired and unconsumed company claim',()=>{
  assert.equal(canRecoverExpiredCompanyClaim(base()).authorized,true);
});
test('refuses consumed lease even if expired',()=>{
  const a=base();a.capabilities[0].consumed_at='2026-10-11T09:59:00Z';
  assert.equal(canRecoverExpiredCompanyClaim(a).reason,'CAPABILITY_ACTIVE_OR_CONSUMED');
});
test('refuses still active lease',()=>{
  const a=base();a.capabilities[0].expires_at='2026-10-11T14:00:00Z';
  assert.equal(canRecoverExpiredCompanyClaim(a).reason,'CAPABILITY_ACTIVE_OR_CONSUMED');
});
test('refuses known or possible external effects',()=>{
  for(const flag of ['provider_create_success','provider_publication_ack_verified','possible_provider_side_effect','republish_forbidden']){
    const a=base();a.decision.delivery_evidence[flag]=true;
    assert.equal(canRecoverExpiredCompanyClaim(a).reason,'AMBIGUOUS_OR_CONFIRMED_PROVIDER_EFFECT');
  }
});
test('refuses missing immutable no-send evidence',()=>{
  const a=base();delete a.obligation.evidence.possible_provider_side_effect;
  assert.equal(canRecoverExpiredCompanyClaim(a).reason,'MISSING_EXPLICIT_NO_SEND_EVIDENCE');
});
test('refuses duplicate reservation or external id',()=>{
  const a=base();a.reservations=[{reservation_key:'claim:2026-10-11:linkedin_company'}];
  assert.equal(canRecoverExpiredCompanyClaim(a).reason,'UNIQUENESS_CLAIM_EXISTS');
  const b=base();b.obligation.external_id='urn:li:share:123';
  assert.equal(canRecoverExpiredCompanyClaim(b).reason,'OBLIGATION_MAY_HAVE_BEEN_SENT');
});
test('refuses previous day, other channel, or other blocker',()=>{
  const a=base();a.runDate='2026-10-10';
  assert.equal(canRecoverExpiredCompanyClaim(a).reason,'SAME_DAY_ONLY');
  const b=base();b.decision.channel='linkedin_personal';
  assert.equal(canRecoverExpiredCompanyClaim(b).reason,'NOT_ORIGINAL_BLOCKED_CLAIM');
  const c=base();c.decision.delivery_evidence.error='PROVIDER_ACK_UNKNOWN';
  assert.equal(canRecoverExpiredCompanyClaim(c).reason,'DIFFERENT_BLOCKER');
});
