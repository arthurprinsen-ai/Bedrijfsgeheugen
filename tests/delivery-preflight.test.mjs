import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

async function createIsolatedLearningFixture(dir, { lessons = [], rules = [] } = {}) {
  const lessonsPath = join(dir, 'lessons.json');
  const rulesPath = join(dir, 'rules.json');
  const chatLessonsPath = join(dir, 'chat-lessons.json');
  const continuityPath = join(dir, 'continuity.json');
  const executionLessonsPath = join(dir, 'execution-lessons.json');
  const remediationOwnershipPath = join(dir, 'remediation-ownership.json');
  const ciEfficiencyPath = join(dir, 'ci-efficiency.json');
  await Promise.all([
    writeFile(lessonsPath, JSON.stringify({ lessons })),
    writeFile(rulesPath, JSON.stringify({ rules })),
    writeFile(chatLessonsPath, JSON.stringify({ version: 'BRAIN-CHAT-LEARNING-v1', preflightRequired: true, newAgentsMustReadBeforeExecution: true, lessons: [] })),
    writeFile(continuityPath, JSON.stringify({ powerhouse_lessons: [] })),
    writeFile(executionLessonsPath, JSON.stringify({ version: 'BRAIN-CHAT-LEARNING-v1', appendOnly: true, lessons: [] })),
    writeFile(remediationOwnershipPath, JSON.stringify({ version: 'BRAIN-CHAT-LEARNING-v1', appendOnly: true, lessons: [] })),
    writeFile(ciEfficiencyPath, JSON.stringify({ version: 'BRAIN-CHAT-LEARNING-v1', appendOnly: true, lessons: [] })),
  ]);
  return { lessonsPath, rulesPath, chatLessonsPath, continuityPath, executionLessonsPath, remediationOwnershipPath, ciEfficiencyPath };
}

test('repository delivery ledger has an active prevention for every PROVEN lesson', async () => {
  const decision = await loadDeliveryPreflight({ component: 'shared' });
  assert.equal(decision.ok, true);
  assert.ok(decision.reusedLessons.length >= 1);
});

test('CI trigger ownership learning is reused before expensive delivery work', async () => {
  const decision = await loadDeliveryPreflight({ component: 'shared' });
  assert.ok(decision.reusedLessons.includes('ci-trigger-scope-ownership-mismatch-v1'));
  assert.ok(decision.appliedPreventionRules.includes('SCOPE_EXPENSIVE_WORKFLOWS_TO_OWNED_PATHS'));
  const knowledge = decision.guardKnowledge.find(item => item.fingerprint === 'ci-trigger-scope-ownership-mismatch-v1');
  assert.equal(knowledge?.regressionContract, 'tests/live-preview-trigger-scope.test.mjs');
  assert.equal(knowledge?.owner, 'ci-governance');
});

test('preflight fails closed when a PROVEN lesson is missing from active prevention registry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'delivery-preflight-'));
  const fixture = await createIsolatedLearningFixture(dir, {
    lessons: [{ fingerprint: 'x', stage: 'MERGE', component: 'shared', preventionRule: 'MISSING_RULE', status: 'PROVEN' }],
    rules: [],
  });
  await assert.rejects(() => loadDeliveryPreflight(fixture), /MISSING_RULE/);
});

test('preflight fails closed when an active prevention rule has no PROVEN lesson explaining it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'delivery-preflight-orphan-rule-'));
  const fixture = await createIsolatedLearningFixture(dir, {
    lessons: [],
    rules: [{ id: 'ORPHAN_RULE', active: true, scope: 'shared' }],
  });
  await assert.rejects(() => loadDeliveryPreflight(fixture), /active prevention rules missing PROVEN lesson: ORPHAN_RULE/);
});
