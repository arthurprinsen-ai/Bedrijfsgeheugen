import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const policy = JSON.parse(readFileSync(new URL('../config/powerhouse-one-loop-v1.json', import.meta.url), 'utf8'));

test('One Loop policy preserves single-memory and recovery invariants', () => {
  assert.equal(policy.version, 'POWERHOUSE-ONE-LOOP-v1');
  assert.equal(policy.recovery.oneActiveCandidatePerObligation, true);
  assert.equal(policy.recovery.idempotentReadbackBeforeRetry, true);
  assert.equal(policy.optimization.finishBeforeStart, true);
  assert.equal(policy.optimization.neverWeakenSecurityIntegrityTruthReleaseEvidenceGates, true);
  for (const state of ['COMMITTED', 'PR_OPEN', 'CI_QUEUED', 'TIMEOUT', 'CHAT_STOPPED', 'WORKER_LOST', 'LEASE_EXPIRED']) {
    assert.ok(policy.recoverableStates.includes(state), state);
  }
});
