import test from 'node:test';
import assert from 'node:assert/strict';
import { regulatoryFrameworkDigest, applyRegulatoryBaselineToPortalControls } from '../regulatory-baseline.js';

const state={sources:{
  ai:{id:'eu-ai-act',framework:'EU_AI_ACT',httpStatus:200,sourceContentVerified:true,contentSha256:'abc'},
  nis:{id:'nl-cyberbeveiligingswet',framework:'NIS2_CBW',httpStatus:200,sourceContentVerified:true,contentSha256:'def'}
}};

test('portal regulatory digest is deterministic per framework',()=>{
  assert.equal(regulatoryFrameworkDigest(state,'AI Act'),'eu-ai-act:abc');
  assert.equal(regulatoryFrameworkDigest(state,'NIS2'),'nl-cyberbeveiligingswet:def');
});

test('old reviewed control is forced back to review while evidence remains intact',()=>{
  const [row]=applyRegulatoryBaselineToPortalControls([{id:'AI-1',framework:'AI Act',evidence:true,reviewed:true,approved:true,regulatoryBaselineDigest:'eu-ai-act:old'}],state);
  assert.equal(row.evidence,true);
  assert.equal(row.reviewed,false);
  assert.equal(row.approved,false);
  assert.equal(row.regulatoryReviewRequired,true);
  assert.equal(row.currentRegulatoryBaselineDigest,'eu-ai-act:abc');
});

test('control reviewed against current baseline stays reviewed',()=>{
  const [row]=applyRegulatoryBaselineToPortalControls([{id:'N2',framework:'NIS2',reviewed:true,approved:true,regulatoryBaselineDigest:'nl-cyberbeveiligingswet:def'}],state);
  assert.equal(row.reviewed,true);
  assert.equal(row.approved,true);
  assert.notEqual(row.regulatoryReviewRequired,true);
});

test('historical EUR-Lex HTTP 202 is not a legal source digest or current verified baseline',()=>{
  const historical={sources:{
    'eu-ai-act':{id:'eu-ai-act',framework:'EU_AI_ACT',httpStatus:202,contentSha256:'unverified-202-hash',changed:true},
    'eu-gdpr':{id:'eu-gdpr',framework:'GDPR_DATA',httpStatus:202,contentSha256:'unverified-gdpr-hash',changed:true},
    'nl-cyberbeveiligingswet':{id:'nl-cyberbeveiligingswet',framework:'NIS2_CBW',httpStatus:200,contentSha256:'reliable-ncsc'}
  }};
  assert.equal(regulatoryFrameworkDigest(historical,'EU_AI_ACT'),null);
  assert.equal(regulatoryFrameworkDigest(historical,'GDPR'),null);
  assert.equal(regulatoryFrameworkDigest(historical,'NIS2'),'nl-cyberbeveiligingswet:reliable-ncsc');
  const [ai,gdpr,nis]=applyRegulatoryBaselineToPortalControls([
    {id:'ai',framework:'EU_AI_ACT',reviewed:true,approved:true,evidence:[{id:'keep'}]},
    {id:'gdpr',framework:'GDPR_DATA',reviewed:true,approved:true},
    {id:'nis',framework:'NIS2_CBW',reviewed:true,approved:true,regulatoryBaselineDigest:'nl-cyberbeveiligingswet:reliable-ncsc'}
  ],historical);
  for(const row of [ai,gdpr]){
    assert.equal(row.regulatoryReviewRequired,true);
    assert.equal(row.regulatorySourceVerification,'UNVERIFIED');
    assert.equal(row.reviewed,false);
    assert.equal(row.approved,false);
    assert.equal(row.currentRegulatoryBaselineDigest,null);
  }
  assert.deepEqual(ai.evidence,[{id:'keep'}],'evidence preserved but prior review revoked');
  assert.equal(nis.reviewed,true);
  assert.equal(nis.approved,true);
});

test('no source, failed read and unverified 200 challenge do not grant regulated approval',()=>{
  const empty={sources:{}};
  const controls=[
    {framework:'EU_AI_ACT',reviewed:true,approved:true},
    {framework:'ISO_27001',reviewed:true,approved:true}
  ];
  const [regulated,unrelated]=applyRegulatoryBaselineToPortalControls(controls,empty);
  assert.equal(regulated.regulatoryReviewRequired,true);
  assert.equal(regulated.approved,false);
  assert.equal(unrelated.approved,true);
  assert.equal(unrelated.regulatoryReviewRequired,undefined);
  assert.equal(regulatoryFrameworkDigest({sources:{x:{
    id:'x',framework:'EU_AI_ACT',httpStatus:200,verification:'UNVERIFIED_ACCESS_INTERSTITIAL',contentSha256:'x'
  }}},'EU_AI_ACT'),null);
});
