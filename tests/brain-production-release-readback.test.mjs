import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyProductionEvidence } from '../tools/site-shell/verify-production-release.mjs';

const sha='a'.repeat(40);

test('accepts exact production SHA with deploy id', () => {
  assert.equal(verifyProductionEvidence({evidence:{commit_ref:sha,context:'production',deploy_id:'deploy-1'},expectedSha:sha}).ok,true);
});

test('rejects stale production SHA', () => {
  const result=verifyProductionEvidence({evidence:{commit_ref:'b'.repeat(40),context:'production',deploy_id:'deploy-1'},expectedSha:sha});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'production-sha-mismatch');
});

test('rejects deploy preview evidence as production', () => {
  const result=verifyProductionEvidence({evidence:{commit_ref:sha,context:'deploy-preview',deploy_id:'deploy-1'},expectedSha:sha});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'not-production-context');
});
