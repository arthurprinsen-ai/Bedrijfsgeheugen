import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = 'config/chat-learning-completeness-guard.json';
const BROWSER_CONTRACT_PATH = 'config/browser-evidence-guard-contract.json';
const SHARED_MEMORY_WORKFLOW = '.github/workflows/shared-agent-memory-tests.yml';
const MOVING_MAIN_INCIDENT = 'brain/learning/incidents/moving-main-pr-status-stale-readback-2026-08-31.json';
const CHAT_CHECKPOINT_PATH = 'brain/learning/chat-completeness-checkpoint-2026-08-31.json';
const CHAT_LEARNING_CONTRACT_PATH = 'config/brain-chat-learning-contract.json';
const CHAT_TO_BRAIN_POLICY_PATH = 'brain/policies/chat-to-brain-completeness-v1.json';

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

test('all durable learnings from the active chat are indexed in canonical Brain memory', async () => {
  const checkpoint = await readJson(CHAT_CHECKPOINT_PATH);
  const completion = await readJson(CONTRACT_PATH);
  const brainContract = await readJson(CHAT_LEARNING_CONTRACT_PATH);

  assert.equal(checkpoint.version, 'CHAT-COMPLETENESS-CHECKPOINT-2026-08-31-v1');
  assert.equal(checkpoint.chatOnlyMaterialLearningRemaining, 0);
  assert.equal(checkpoint.policy.chatIsNotCanonicalMemory, true);
  assert.equal(checkpoint.policy.futureAgentsMustUseCanonicalBrainSources, true);
  assert.ok(completion.requiredCanonicalSources.includes(CHAT_CHECKPOINT_PATH));
  assert.ok(brainContract.canonicalSources.includes(CHAT_CHECKPOINT_PATH));

  const requiredFingerprints = [
    'make|scenario-activity|ambiguous-status-fields-v1',
    'repeated-known-blocker-no-state-v1',
    'instagram|publish|create-without-readback-verification',
    'instagram|notion|empty-search-sentinel-update',
    'instagram|routing|native-id-entered-buffer-legacy',
    'instagram|learning|duplicate-basic-metric-snapshot',
    'delivery-failure|merge|shared|stale-base-after-parallel-main-change',
    'github|pr|moving-main|stale-merge-status-caused-duplicate-reconstruction-v1',
    'github|main|native-protection-absent',
    'learning|completion|premature-stop-open-obligations',
    'agent-fabric|completion|local-resolved-bypasses-global-obligations'
  ];
  const indexed = new Set(checkpoint.learnings.map(item => item.fingerprint));
  for (const fingerprint of requiredFingerprints) {
    assert.ok(indexed.has(fingerprint), `missing durable chat learning ${fingerprint}`);
  }
  for (const item of checkpoint.learnings) {
    assert.equal(item.chatOnly, false, `learning must not remain chat-only: ${item.fingerprint}`);
    assert.ok(Array.isArray(item.canonicalSources) && item.canonicalSources.length > 0,
      `learning must point to canonical Brain sources: ${item.fingerprint}`);
    assert.ok(item.preventionRule || item.regressionContract,
      `learning needs prevention or regression coverage: ${item.fingerprint}`);
  }
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

test('chat-to-Brain normalization is explicit, deduplicating and cross-chat canonical', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.completionPolicy.rule, 'NO_MATERIAL_LEARNING_ONLY_IN_CHAT');
  assert.deepEqual(contract.normalizationPipeline, [
    'extract',
    'classify',
    'fingerprint',
    'deduplicate',
    'link_evidence',
    'normalize',
    'persist_to_brain',
    'refresh_shared_context',
    'make_available_to_preflight'
  ]);
  assert.equal(contract.dedupe.requiredBeforeWrite, true);
  assert.equal(contract.dedupe.duplicateAction, 'COALESCE_WITH_EXISTING_RECORD');
  assert.equal(contract.crossChatRequirement.conversationHistoryIsNotCanonicalTruth, true);
  assert.equal(contract.crossChatRequirement.canonicalBrainWinsOnConflict, true);
  assert.ok(contract.materiality.exclude.includes('secrets'));
  assert.ok(contract.materiality.exclude.includes('credentials'));
  assert.ok(contract.materiality.exclude.includes('PII'));
});

test('moving-main replacement requires fresh authoritative PR and main readback', async () => {
  const incident = await readJson(MOVING_MAIN_INCIDENT);
  assert.equal(incident.fingerprint, 'github|pr|moving-main|stale-merge-status-caused-duplicate-reconstruction-v1');
  assert.equal(incident.status, 'PROVEN_AND_CONTAINED');
  assert.equal(incident.regressionContract.replacementRequiresFreshOriginalPrRead, true);
  assert.equal(incident.regressionContract.replacementRequiresFreshMainRead, true);
  assert.equal(incident.regressionContract.mergedOriginalBlocksReplacement, true);
  assert.equal(incident.regressionContract.equivalentContentAlreadyOnMainBlocksReplacement, true);
  const guarded = (await readJson(CONTRACT_PATH)).knownFailureFingerprints.find(
    x => x.fingerprint === incident.fingerprint
  );
  assert.ok(guarded, 'moving-main failure must be available to future preflight');
  assert.match(guarded.preventionRule, /re-read|lees.*opnieuw|authoritative/i);
});

test('one canonical chat-to-Brain policy owns semantics and the completeness guard is enforcement projection only', async () => {
  const policy = await readJson(CHAT_TO_BRAIN_POLICY_PATH);
  const guard = await readJson(CONTRACT_PATH);
  assert.equal(policy.authority.role, 'CANONICAL_POLICY');
  assert.equal(policy.authority.enforcementProjection, CONTRACT_PATH);
  assert.equal(guard.authority.role, 'ENFORCEMENT_PROJECTION');
  assert.equal(guard.authority.canonicalPolicy, CHAT_TO_BRAIN_POLICY_PATH);
  assert.equal(guard.authority.conflictResolution, 'CANONICAL_POLICY_WINS');
});

test('PR lifecycle mutations require fresh authoritative PR readback immediately before mutation', async () => {
  const incident = await readJson(MOVING_MAIN_INCIDENT);
  assert.equal(incident.regressionContract.lifecycleMutationRequiresFreshPrRead, true);
  assert.deepEqual(incident.regressionContract.lifecycleMutationsCovered, ['close', 'reopen', 'supersede', 'replace']);
  assert.ok(Array.isArray(incident.additionalEvidence));
  assert.ok(incident.additionalEvidence.some(x => x.pullRequest === 853 && x.observation === 'parallel-close-invalidated-earlier-snapshot'));
});
