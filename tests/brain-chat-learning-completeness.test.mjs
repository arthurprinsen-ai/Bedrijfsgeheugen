import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = 'config/chat-learning-completeness-guard.json';
const BROWSER_CONTRACT_PATH = 'config/browser-evidence-guard-contract.json';
const SHARED_MEMORY_WORKFLOW = '.github/workflows/shared-agent-memory-tests.yml';
const SESSION_BUNDLE_PATH = 'brain/learning/chat-session-2026-08-30-31.json';
const PREVENTION_RULES_PATH = 'config/delivery-prevention-rules.json';

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

test('completion is bound to the same canonical learning sources used by delivery preflight', async () => {
  const contract = await readJson(CONTRACT_PATH);
  for (const required of [
    'docs/brain/delivery-failure-lessons.json',
    'config/delivery-prevention-rules.json',
    'brain/learning/current-execution-lessons-2026-08-30.json',
    'brain/learning/chat-completeness-addendum-2026-08-30.json',
    'tools/delivery-preflight.mjs'
  ]) {
    assert.ok(contract.requiredCanonicalSources.includes(required), `missing canonical completion source ${required}`);
  }
  assert.equal(contract.completionPolicy.requireDeliveryPreflightGreen, true);
  assert.equal(contract.completionPolicy.blockOnOrphanActivePreventionRule, true);
});

test('agents cannot stop on local green while material obligations remain open', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.completionPolicy.localGreenIsNotCompletion, true);
  assert.equal(contract.completionPolicy.continueUntilAllMaterialObligationsTerminal, true);
  assert.equal(contract.completionPolicy.hardBoundaryMustBeExplicitlyProven, true);

  const rule = contract.knownFailureFingerprints.find(
    x => x.fingerprint === 'learning|completion|premature-stop-open-obligations'
  );
  assert.ok(rule, 'missing premature-stop learning fingerprint');
  assert.equal(rule.failedApproach, 'Stoppen na lokale technische groenstatus terwijl materiële outcome-, delivery-, recovery- of production-obligations nog open staan.');
  assert.match(rule.preventionRule, /alle materiële obligations/i);
  assert.equal(rule.status, 'GUARDED');
});

test('Agent Fabric terminal completion bypass remains canonical guarded learning', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const rule = contract.knownFailureFingerprints.find(
    x => x.fingerprint === 'agent-fabric|completion|local-resolved-bypasses-global-obligations'
  );
  assert.ok(rule, 'missing Agent Fabric completion-bypass fingerprint');
  assert.match(rule.rootCause, /evaluateCompletionReadiness/);
  assert.match(rule.preventionRule, /Geen AgentWork-terminalisatie/);
  assert.match(rule.regressionContract, /tests\/agent-fabric\.test\.mjs/);
  assert.equal(rule.status, 'GUARDED');
});

test('shared agent memory CI executes the chat-learning completeness guard', async () => {
  const workflow = await readFile(SHARED_MEMORY_WORKFLOW, 'utf8');
  assert.match(workflow, /tests\/brain-chat-learning-completeness\.test\.mjs/);
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

test('material learnings from the 2026-08-30/31 implementation chat are persisted as a canonical Brain session bundle', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const bundle = await readJson(SESSION_BUNDLE_PATH);
  assert.ok(contract.requiredCanonicalSources.includes(SESSION_BUNDLE_PATH));
  assert.equal(bundle.version, 'BRAIN-CHAT-SESSION-LEARNING-v1');
  assert.equal(bundle.canonicalTruth, 'GitHub');
  assert.equal(bundle.conversationIsCanonicalTruth, false);
  assert.ok(bundle.learnings.length >= 18, 'session bundle must contain the material causal learnings from the implementation chat');
  assert.ok(bundle.verifiedCapabilities.length >= 10, 'session bundle must preserve the proven capabilities, not only failures');
  assert.ok(bundle.openHardBoundaries.length >= 1, 'external hard boundaries must remain explicit instead of being silently marked green');
});

test('every session learning has a full causal chain and an active prevention rule', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const bundle = await readJson(SESSION_BUNDLE_PATH);
  const rulesDoc = await readJson(PREVENTION_RULES_PATH);
  const activeRules = new Set((rulesDoc.rules || []).filter(rule => rule.active === true).map(rule => rule.id));
  for (const learning of bundle.learnings) {
    for (const field of contract.requiredLearningFields) {
      assert.ok(learning[field], `${learning.fingerprint || '<unknown>'} missing ${field}`);
    }
    assert.ok(activeRules.has(learning.preventionRule), `${learning.fingerprint} prevention rule ${learning.preventionRule} is not active`);
  }
});

test('session bundle separates proven system capability from external platform enforcement', async () => {
  const bundle = await readJson(SESSION_BUNDLE_PATH);
  const writerReadiness = bundle.verifiedCapabilities.find(x => x.id === 'repository-writers-7-of-7-parity-rollback');
  assert.equal(writerReadiness?.status, 'PROVEN');
  const githubProtection = bundle.openHardBoundaries.find(x => x.id === 'github-native-main-protection');
  assert.ok(githubProtection);
  assert.equal(githubProtection.status, 'BLOCKED_EXTERNAL');
  assert.equal(githubProtection.mustNotBeInferredFromInternalCi, true);
});
