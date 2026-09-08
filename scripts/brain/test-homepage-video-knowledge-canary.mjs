import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateKnowledgeCompletion} from '../../brain/guards/knowledge-completion-gate.mjs';

const canary=JSON.parse(fs.readFileSync('brain/evidence/homepage-video-knowledge-canary-2026-09-08.json','utf8'));
const videoLearning=JSON.parse(fs.readFileSync('brain/learning/homepage-hero-video-autoplay-lifecycle-recovery-v1.json','utf8'));
const statusLearning=JSON.parse(fs.readFileSync('brain/learning/github-required-test-synthetic-merge-ref-status-gap-v1.json','utf8'));

test('homepage-video canary reconstructs exact production chain',()=>{
  assert.equal(canary.source_refs.find(x=>x.kind==='pull_request').id,'1159');
  assert.equal(canary.source_refs.find(x=>x.kind==='production_deploy').deploy_id,'6a9fe513a7af0e0008661320');
  assert.equal(canary.source_refs.find(x=>x.kind==='merge_commit').sha,'7695e386ed7b234391dfa4d8ef0de7479dd48aa5');
  assert.equal(canary.outcome.status,'success');
  assert.equal(canary.readback.state==='verified'||canary.writeback.state==='blocked',true);
  assert.equal(evaluateKnowledgeCompletion(canary).status,'BLOCKED');
});

test('homepage and GitHub release learnings use permanent fingerprints',()=>{
  assert.equal(videoLearning.fingerprint,'homepage-hero-video-autoplay-lifecycle-recovery-v1');
  assert.equal(statusLearning.fingerprint,'github-required-test-synthetic-merge-ref-status-gap-v1');
  assert.equal(videoLearning.status,'PROVEN');
  assert.equal(statusLearning.status,'PROVEN');
});

test('blocked canary has exactly-once replay ownership and no invented runtime refs',()=>{
  assert.equal(canary.replay_obligation.dedupe_key,'homepage-video-repair-2026-09-08');
  assert.equal(canary.replay_obligation.owner,'Powerhouse Learning');
  assert.equal(canary.writeback.bg168_ref,null);
  assert.equal(canary.writeback.bg166_ref,null);
  assert.equal(canary.readback.bg167_ref,null);
});
