import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT = 'config/branch-delivery-ownership-guard.json';

test('delivery ownership guard blocks stale branch reuse and duplicate semantic owners', async () => {
  const contract = JSON.parse(await readFile(CONTRACT, 'utf8'));
  assert.equal(contract.version, 'BRANCH-DELIVERY-OWNERSHIP-GUARD-v1');
  assert.equal(contract.failClosed, true);
  assert.equal(contract.preflight.requireCurrentMainSha, true);
  assert.equal(contract.preflight.rejectPreviouslyMergedOrSupersededBranch, true);
  assert.equal(contract.preflight.searchOpenPrSemanticOverlap, true);
  assert.equal(contract.preflight.requireCanonicalOwner, true);
  assert.equal(contract.onOverlap, 'REUSE_MERGE_OR_SUPERSEDE');
});

test('ambiguous successor state is never treated as safe delivery ownership', async () => {
  const contract = JSON.parse(await readFile(CONTRACT, 'utf8'));
  assert.equal(contract.ambiguousSuccessorState, 'FAIL_CLOSED');
  assert.equal(contract.knownFailure.fingerprint, 'delivery|branch-pr|stale-reuse-or-duplicate-owner-v1');
  assert.match(contract.knownFailure.failedApproach, /oude|stale|reeds gebruikte/i);
});
