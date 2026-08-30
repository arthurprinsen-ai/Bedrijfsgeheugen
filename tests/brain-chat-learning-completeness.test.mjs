import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = 'config/chat-learning-completeness-guard.json';
const BROWSER_CONTRACT_PATH = 'config/browser-evidence-guard-contract.json';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('chat-learning completeness guard is fail-closed and blocks completion with chat-only material learning', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.version, 'CHAT-LEARNING-COMPLETENESS-GUARD-v1');
  assert.equal(contract.failClosed, true);
  assert.equal(contract.completionPolicy.blockIfMaterialLearningOnlyInChat, true);
  assert.equal(contract.completionPolicy.requirePersistentSharedMemoryWriteback, true);
  assert.equal(contract.completionPolicy.requireRegressionGuardWhereFeasible, true);
});

test('learning records preserve the full causal chain', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.deepEqual(contract.requiredLearningFields, [
    'fingerprint',
    'symptom',
    'rootCause',
    'failedApproach',
    'fix',
    'preventionRule',
    'regressionContract',
    'evidence',
    'owner',
    'status'
  ]);
});

test('known failed approaches cannot be retried without new evidence', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.retryPolicy.maxIdenticalRetriesWithoutNewEvidence, 2);
  assert.equal(contract.retryPolicy.blockKnownFailedApproachWithoutNewEvidence, true);
  assert.equal(contract.retryPolicy.requireNewHypothesisAfterLimit, true);
});

test('connector mutations require schema confirmation and readback', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.connectorMutationSafety.verifyExactMutationToolBeforeWrite, true);
  assert.equal(contract.connectorMutationSafety.noProbeMutations, true);
  assert.equal(contract.connectorMutationSafety.requireReadbackAfterMutation, true);
  assert.equal(contract.connectorMutationSafety.recordUnexpectedSideEffectsAsLearning, true);
});

test('accidental temporary artifacts are treated as incidents, not silently ignored', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const rule = contract.knownFailureFingerprints.find(x => x.fingerprint === 'connector|mutation|probe-created-unwanted-artifacts');
  assert.ok(rule);
  assert.equal(rule.failedApproach, 'Gebruik een muterende create-actie als capability-probe of schema-experiment.');
  assert.equal(rule.preventionRule, 'Capability discovery is read-only; mutations happen only through a confirmed action/schema and are followed by readback.');
});

test('browser evidence learning remains linked as guarded domain knowledge', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const browser = await readJson(BROWSER_CONTRACT_PATH);
  assert.ok(contract.requiredCanonicalSources.includes(BROWSER_CONTRACT_PATH));
  assert.equal(browser.learningLifecycle.GUARDED, 'deterministic-regression-or-validator-enforced');
  assert.equal(browser.completionRule, 'NO_COMPLETION_WHILE_MATERIAL_LEARNING_EXISTS_ONLY_IN_CHAT');
});
