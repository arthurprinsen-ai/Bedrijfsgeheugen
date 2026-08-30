import test from 'node:test';
import assert from 'node:assert/strict';
import { certifyMainProtection } from '../scripts/brain/main-protection-certification.mjs';

const expectedChecks = ['Brain foundation verify', 'Shared Agent Memory Tests', 'V18 Production Promotion', 'Unified Brain Delivery'];

test('certifies main protection only with live protected branch and all required checks', () => {
  const result = certifyMainProtection({
    branch: 'main',
    protected: true,
    protectionEnabled: true,
    enforcementLevel: 'non_admins',
    requiredChecks: expectedChecks,
    expectedChecks,
    rulesets: [{ id: 17, enforcement: 'active', target: 'branch' }],
    observedSha: 'a'.repeat(40),
    evidenceRef: 'github:branch/main',
  });
  assert.equal(result.mainProtectionReady, true);
  assert.equal(result.truth_status, 'VERIFIED');
  assert.deepEqual(result.missingChecks, []);
});

test('fails closed when GitHub reports main unprotected or required checks disabled', () => {
  const result = certifyMainProtection({
    branch: 'main',
    protected: false,
    protectionEnabled: false,
    enforcementLevel: 'off',
    requiredChecks: [],
    expectedChecks,
    rulesets: [],
    observedSha: 'b'.repeat(40),
    evidenceRef: 'github:branch/main',
  });
  assert.equal(result.mainProtectionReady, false);
  assert.equal(result.truth_status, 'BLOCKED');
  assert.match(result.blockers.join(','), /BRANCH_NOT_PROTECTED/);
  assert.match(result.blockers.join(','), /REQUIRED_CHECKS_DISABLED/);
  assert.deepEqual(result.missingChecks, expectedChecks);
});

test('fails closed on stale, incomplete or non-main evidence', () => {
  assert.throws(() => certifyMainProtection({}), /INVALID_BRANCH/);
  assert.throws(() => certifyMainProtection({ branch: 'develop' }), /INVALID_BRANCH/);
  assert.throws(() => certifyMainProtection({ branch: 'main', observedSha: 'short' }), /INVALID_OBSERVED_SHA/);
  assert.throws(() => certifyMainProtection({ branch: 'main', observedSha: 'c'.repeat(40), evidenceRef: '' }), /MISSING_EVIDENCE_REF/);
});
