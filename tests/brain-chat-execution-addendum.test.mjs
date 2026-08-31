import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const ADDENDUM = 'brain/learning/chat-execution-addendum-2026-08-31.json';
const PREFLIGHT = 'brain/learning/chat-execution-addendum-preflight-2026-08-31.json';
const MAKE_BLOCKER = 'brain/learning/chat-make-writeback-blocker-2026-08-31.json';
const RULES = 'config/delivery-prevention-rules.json';
const SHARED_MEMORY_WORKFLOW = '.github/workflows/shared-agent-memory-tests.yml';
const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('implementation chat execution addendum is canonical and references existing Brain truth instead of duplicating it', () => {
  assert.equal(existsSync(ADDENDUM), true);
  const addendum = json(ADDENDUM);
  assert.equal(addendum.version, 'BRAIN-CHAT-EXECUTION-ADDENDUM-v1');
  assert.equal(addendum.duplicateLessonBodies, false);
  assert.equal(addendum.conversationIsCanonicalTruth, false);
  assert.ok(addendum.canonicalReferences.includes('docs/brain/delivery-failure-lessons.json'));
  assert.ok(addendum.canonicalReferences.includes(MAKE_BLOCKER));
  assert.ok(addendum.provenCapabilities.length >= 12);
});

test('every execution prevention referenced by the chat addendum is actively enforced', () => {
  const addendum = json(ADDENDUM);
  const rules = json(RULES);
  const active = new Set((rules.rules || []).filter(rule => rule.active === true).map(rule => rule.id));
  for (const id of addendum.requiredPreventionRules) assert.equal(active.has(id), true, `execution prevention rule not active: ${id}`);
});

test('Make paused-capacity refusal is durable learning with a deduped replay obligation', () => {
  const blocker = json(MAKE_BLOCKER);
  assert.equal(blocker.state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(blocker.latest_writeback_attempt.result, 'FAILED_HARD_BOUNDARY');
  assert.equal(blocker.latest_writeback_attempt.retry_performed, false);
  assert.equal(blocker.replay_obligation.max_replays_after_recovery, 1);
  assert.equal(blocker.replay_obligation.dedupe_required, true);
});

test('bounded agent preflight exposes execution prevention and current authority tool boundary without full addendum body', () => {
  const projection = json(PREFLIGHT);
  assert.equal(Object.prototype.hasOwnProperty.call(projection, 'linked_learning_sources'), false);
  const packet = compileChatLearningPreflight();
  const sources = new Set(packet.sources.map(source => source.path));
  assert.equal(sources.has(PREFLIGHT), true);
  assert.equal(sources.has(ADDENDUM), false);
  assert.ok(packet.fingerprints.includes('connector|delivery|explicit-workflow-dispatch-unavailable-in-chat-surface'));
  assert.ok(packet.preventions.includes('SINGLE_CANONICAL_WRITER_HANDOFF'));
  assert.ok(packet.totalBytes <= 256_000);
});

test('Shared Agent Memory CI executes the execution addendum regression', () => {
  const workflow = readFileSync(SHARED_MEMORY_WORKFLOW, 'utf8');
  assert.match(workflow, /tests\/brain-chat-execution-addendum\.test\.mjs/);
});

test('execution addendum preserves proven capabilities separately from external hard boundaries', () => {
  const addendum = json(ADDENDUM);
  assert.equal(addendum.provenCapabilities.find(x => x.id === 'repository-writers-7-of-7-parity-rollback')?.status, 'PROVEN');
  assert.equal(addendum.externalHardBoundaries.find(x => x.id === 'make-runtime-capacity')?.status, 'BLOCKED_EXTERNAL');
  assert.equal(addendum.externalHardBoundaries.find(x => x.id === 'bg169-explicit-dispatch-tool-surface')?.status, 'BLOCKED_TOOLING');
});
