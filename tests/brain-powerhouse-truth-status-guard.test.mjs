import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const POLICY_PATH = 'brain/policies/powerhouse-truth-status-contract-v1.json';
const PREFLIGHT_PATH = 'scripts/brain/chat-learning-preflight.mjs';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('Powerhouse truth status contract is canonical and fail-closed', async () => {
  const policy = await readJson(POLICY_PATH);
  assert.equal(policy.id, 'powerhouse-truth-status-contract-v1');
  assert.equal(policy.status, 'ACTIVE');
  assert.equal(policy.authority.role, 'CANONICAL_POLICY');
  assert.equal(policy.authority.productionTruthTable, 'public.brain_production_truth');
  assert.equal(policy.authority.conversationHistoryIsNotCanonicalTruth, true);
  assert.equal(policy.authority.canonicalProductionTruthWinsOnConflict, true);
  assert.ok(policy.failClosedRules.includes('ONE_CRITICAL_RED_OR_UNPROVEN_ITEM_BLOCKS_LIVE_BEWEZEN'));
  assert.ok(policy.failClosedRules.includes('CHAT_ASSERTION_IS_NOT_PRODUCTION_EVIDENCE'));
});

test('all execution chats use the exact status vocabulary and evidence fields', async () => {
  const policy = await readJson(POLICY_PATH);
  assert.deepEqual(Object.keys(policy.terminalStatuses), [
    'LIVE_BEWEZEN',
    'DEELS_LIVE',
    'GEBLOKKEERD',
    'NIET_GEDAAN',
    'UNVERIFIED_LEGACY'
  ]);
  assert.deepEqual(policy.completionOutput.requiredFields, [
    'eindstatus',
    'productie',
    'bewijs',
    'gates',
    'open_gaten',
    'powerhouse_writeback'
  ]);
  assert.equal(policy.completionOutput.nextActionOnlyWhenOpen, true);
  assert.equal(policy.completionOutput.noOpenGapsValue, 'GEEN');
});

test('historical chat claims default to unverified until authoritative reconciliation', async () => {
  const policy = await readJson(POLICY_PATH);
  assert.equal(policy.legacyReconciliation.allHistoricalChatStatusClaimsDefaultTo, 'UNVERIFIED_LEGACY');
  assert.equal(policy.legacyReconciliation.historicalMessagesAreImmutable, true);
  assert.equal(policy.legacyReconciliation.centralInterpretationOverridesHistoricalWording, true);
  assert.ok(policy.legacyReconciliation.upgradeOnlyWith.includes('current_authoritative_readback'));
  assert.ok(policy.legacyReconciliation.upgradeOnlyWith.includes('exact_identity_match'));
  assert.ok(policy.legacyReconciliation.upgradeOnlyWith.includes('open_gap_reconciliation'));
});

test('future agent preflight includes the canonical Powerhouse truth status policy', async () => {
  const source = await readFile(PREFLIGHT_PATH, 'utf8');
  assert.match(source, /brain\/policies\/powerhouse-truth-status-contract-v1\.json/);
});

test('cross-chat enforcement requires production truth reconciliation', async () => {
  const policy = await readJson(POLICY_PATH);
  assert.equal(policy.crossChatEnforcement.allFutureAgentsMustReadThisPolicyBeforeMaterialExecution, true);
  assert.equal(policy.crossChatEnforcement.allExecutionChatsMustUseTerminalStatusContract, true);
  assert.equal(policy.crossChatEnforcement.allMaterialStatusChangesMustReconcileToProductionTruth, true);
  assert.equal(policy.crossChatEnforcement.localMemoryIsProjectionOnly, true);
  assert.equal(policy.learning.regressionContract, 'tests/brain-powerhouse-truth-status-guard.test.mjs');
  assert.equal(policy.learning.status, 'GUARDED');
});
