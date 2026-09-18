import test from 'node:test';
import assert from 'node:assert/strict';
import { regulatoryFrameworkDigest, applyRegulatoryBaselineToPortalControls } from '../regulatory-baseline.js';

const state={sources:{
  ai:{id:'eu-ai-act',framework:'EU_AI_ACT',contentSha256:'abc'},
  nis:{id:'nl-cyberbeveiligingswet',framework:'NIS2_CBW',contentSha256:'def'}
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
