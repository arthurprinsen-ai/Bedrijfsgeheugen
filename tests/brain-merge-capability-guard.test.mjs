import test from 'node:test';
import assert from 'node:assert/strict';
import {determineMergeCapability, filterUnsupportedMergeQueueRules, classifyRulesetApiError} from '../tools/delivery/merge-capability-guard.mjs';
test('historical replay: personal-owner queue rule is prevented before submission',()=>{
  assert.equal(determineMergeCapability({owner:{type:'User'}}).mode,'protected_pr');
  assert.throws(()=>filterUnsupportedMergeQueueRules({owner:{type:'User'}},[{type:'merge_queue'}]),/UNSUPPORTED/);
});
test('historical replay: GitHub 422 does not repeat identical request',()=>{
  const r=classifyRulesetApiError(422,"Invalid rule 'merge_queue'");
  assert.equal(r.retryIdenticalPayload,false);
  assert.equal(r.fallback,'protected_pr');
});
