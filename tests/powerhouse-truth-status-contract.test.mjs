import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contract = JSON.parse(await readFile(new URL('../config/powerhouse-truth-status-contract.json', import.meta.url), 'utf8'));

test('truth status contract is fail-closed and canonical', () => {
  assert.equal(contract.canonical, true);
  assert.equal(contract.failClosed, true);
  assert.equal(contract.scope, 'all-current-and-future-agents-chats-workflows');
});

test('execution status vocabulary is exact and legacy verification is separate', () => {
  assert.deepEqual(contract.executionStatuses, ['LIVE_BEWEZEN', 'DEELS_LIVE', 'GEBLOKKEERD', 'NIET_GEDAAN']);
  assert.deepEqual(contract.verificationStates, ['VERIFIED', 'UNVERIFIED_LEGACY']);
  assert.equal(contract.legacyPolicy.historicalChatClaimsDefaultTo, 'UNVERIFIED_LEGACY');
  assert.equal(contract.legacyPolicy.chatTextNeverOverridesCanonicalRuntimeEvidence, true);
});

test('LIVE_BEWEZEN requires production proof, green gates, no gaps and verified writeback', () => {
  const required = contract.liveProvenInvariant.requires;
  assert.equal(contract.liveProvenInvariant.status, 'LIVE_BEWEZEN');
  assert.equal(required.verification_state, 'VERIFIED');
  assert.equal(required.production_ref_present, true);
  assert.equal(required.evidence_non_empty, true);
  assert.equal(required.all_required_gates_green, true);
  assert.equal(required.open_gaps_empty, true);
  assert.equal(required.powerhouse_writeback_verified, true);
});

test('contract reuses existing Powerhouse lineage and forbids a second truth store', () => {
  assert.equal(contract.writebackPolicy.reuseExistingPowerhouseLineage, true);
  assert.equal(contract.writebackPolicy.parallelTruthStoreForbidden, true);
  assert.equal(contract.writebackPolicy.runtimeEventRequired, true);
  assert.equal(contract.writebackPolicy.learningWritebackRequired, true);
  assert.equal(contract.writebackPolicy.sharedContextRefreshRequired, true);
});
