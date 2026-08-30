import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = 'config/chat-learning-completeness-guard.json';
const BROWSER_CONTRACT_PATH = 'config/browser-evidence-guard-contract.json';
const DELIVERY_LESSON_PATHS = [
  'docs/brain/delivery-failure-lessons.json',
  'docs/brain/delivery-failure-lessons-tooling.json',
];
const PREVENTION_RULES_PATH = 'config/delivery-prevention-rules.json';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readAllLessons() {
  const docs = await Promise.all(DELIVERY_LESSON_PATHS.map(readJson));
  return docs.flatMap(doc => doc.lessons || []);
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
    'fingerprint', 'symptom', 'rootCause', 'failedApproach', 'fix',
    'preventionRule', 'regressionContract', 'evidence', 'owner', 'status'
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

test('all delivery lesson ledgers and active prevention rules are mandatory canonical chat-learning sources', async () => {
  const contract = await readJson(CONTRACT_PATH);
  for (const path of DELIVERY_LESSON_PATHS) assert.ok(contract.requiredCanonicalSources.includes(path));
  assert.ok(contract.requiredCanonicalSources.includes(PREVENTION_RULES_PATH));
  assert.equal(contract.crossSourceCompleteness?.requireEveryActivePreventionRuleHasProvenLesson, true);
  assert.equal(contract.crossSourceCompleteness?.requireEveryProvenLessonHasActivePreventionRule, true);
});

test('every active prevention rule is backed by PROVEN learning and every PROVEN lesson remains actively enforced', async () => {
  const [lessons, rulesDoc] = await Promise.all([readAllLessons(), readJson(PREVENTION_RULES_PATH)]);
  const provenRules = new Set(lessons.filter(item => item.status === 'PROVEN').map(item => item.preventionRule));
  const activeRules = new Set((rulesDoc.rules || []).filter(item => item.active === true).map(item => item.id));
  const activeWithoutLearning = [...activeRules].filter(id => !provenRules.has(id));
  const provenWithoutActiveRule = [...provenRules].filter(id => !activeRules.has(id));
  assert.deepEqual(activeWithoutLearning, [], `active prevention rules without PROVEN learning: ${activeWithoutLearning.join(', ')}`);
  assert.deepEqual(provenWithoutActiveRule, [], `PROVEN lessons without active prevention: ${provenWithoutActiveRule.join(', ')}`);
});

test('chat-learning canonical records do not contain duplicate fingerprints or prevention rule ids', async () => {
  const [lessons, rulesDoc] = await Promise.all([readAllLessons(), readJson(PREVENTION_RULES_PATH)]);
  const fingerprints = lessons.map(item => item.fingerprint);
  const ruleIds = (rulesDoc.rules || []).map(item => item.id);
  assert.equal(new Set(fingerprints).size, fingerprints.length, 'duplicate delivery learning fingerprint detected');
  assert.equal(new Set(ruleIds).size, ruleIds.length, 'duplicate prevention rule id detected');
});
