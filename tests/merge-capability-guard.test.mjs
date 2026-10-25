import test from 'node:test';
import assert from 'node:assert/strict';
import { determineMergeCapability, filterUnsupportedMergeQueueRules, classifyRulesetApiError, releaseEvidenceStatus } from '../tools/delivery/merge-capability-guard.mjs';
const personal = { owner: { type: 'User' } };
test('personal repositories cannot request merge_queue rules', () => {
  assert.equal(determineMergeCapability(personal).mode, 'protected_pr');
  assert.throws(() => filterUnsupportedMergeQueueRules(personal, [{ type: 'merge_queue' }]), /MERGE_QUEUE_UNSUPPORTED/);
  assert.deepEqual(filterUnsupportedMergeQueueRules(personal, [{ type: 'required_status_checks' }]), [{ type: 'required_status_checks' }]);
});
test('organization ownership alone is not enough to enable merge queue', () => {
  assert.throws(() => filterUnsupportedMergeQueueRules({ owner: { type: 'Organization' } }, [{ type: 'merge_queue' }]), /UNVERIFIED/);
  assert.throws(() => filterUnsupportedMergeQueueRules({}, []), /OWNER_UNVERIFIED/);
});
test('422 invalid rule is classified as non-retryable capability error', () => {
  assert.deepEqual(classifyRulesetApiError(422, "Invalid rule 'merge_queue'"), { category: 'UNSUPPORTED_MERGE_QUEUE', retryIdenticalPayload: false, fallback: 'protected_pr' });
});
test('no green deployment based on checks only, missing readback or stale commit', () => {
  const proof = { headSha:'head1', baseSha:'main1', verifiedBaseSha:'main1', requiredChecks: Object.fromEntries(['Required','BRAIN','CodeQL'].map(n=>[n,{headSha:'head1',conclusion:'success'}])), mergedSha:'merged1', deployedSha:'merged1', productionReadback:{ok:true,sha:'merged1'} };
  assert.equal(releaseEvidenceStatus(proof).ready,true);
  assert.equal(releaseEvidenceStatus({...proof, productionReadback:null}).ready,false);
  assert.equal(releaseEvidenceStatus({...proof, verifiedBaseSha:'main2'}).ready,false);
  assert.equal(releaseEvidenceStatus({...proof, requiredChecks:{...proof.requiredChecks,CodeQL:{headSha:'old',conclusion:'success'}}}).ready,false);
});
