import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const ADDENDUM = 'brain/learning/chat-execution-addendum-2026-08-31.json';
const MAKE_INCIDENT = 'brain/learning/incidents/make-team-paused-capacity-2026-08-31.json';
const GUARD = 'config/chat-learning-completeness-guard.json';
const CONTRACT = 'config/brain-chat-learning-contract.json';
const RULES = 'config/delivery-prevention-rules.json';

const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('implementation chat execution addendum is canonical and references existing Brain truth instead of duplicating it', () => {
  assert.equal(existsSync(ADDENDUM), true, 'missing execution addendum');
  const addendum = json(ADDENDUM);
  assert.equal(addendum.version, 'BRAIN-CHAT-EXECUTION-ADDENDUM-v1');
  assert.equal(addendum.parentCheckpoint, 'brain/learning/chat-completeness-checkpoint-2026-08-31.json');
  assert.equal(addendum.duplicateLessonBodies, false);
  assert.equal(addendum.conversationIsCanonicalTruth, false);
  assert.ok(addendum.canonicalReferences.includes('docs/brain/delivery-failure-lessons.json'));
  assert.ok(addendum.canonicalReferences.includes('brain/learning/chat-runtime-truth-lessons-2026-08-31.json'));
  assert.ok(addendum.canonicalReferences.includes(MAKE_INCIDENT));
  assert.ok(addendum.provenCapabilities.length >= 12);
});

test('every execution prevention referenced by the chat addendum is actively enforced', () => {
  const addendum = json(ADDENDUM);
  const rules = json(RULES);
  const active = new Set((rules.rules || []).filter(rule => rule.active === true).map(rule => rule.id));
  assert.ok(addendum.requiredPreventionRules.length >= 18);
  for (const id of addendum.requiredPreventionRules) {
    assert.equal(active.has(id), true, `execution prevention rule not active: ${id}`);
  }
});

test('Make capacity refusal is durable learning and defers runtime projection without losing canonical persistence', () => {
  assert.equal(existsSync(MAKE_INCIDENT), true, 'missing Make capacity incident');
  const incident = json(MAKE_INCIDENT);
  assert.equal(incident.fingerprint, 'make|capacity|team-paused-runtime-learning-writeback');
  assert.equal(incident.status, 'GUARDED');
  assert.equal(incident.preventionRule, 'BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE');
  assert.equal(incident.canonicalPersistencePreserved, true);
  assert.equal(incident.runtimeProjectionDeferred, true);
  assert.equal(incident.recovery.maxBlindRetries, 0);
});

test('chat learning preflight and completeness guard both require the execution addendum and capacity incident', () => {
  const guard = json(GUARD);
  const contract = json(CONTRACT);
  for (const source of [ADDENDUM, MAKE_INCIDENT]) {
    assert.ok(guard.requiredCanonicalSources.includes(source), `completeness guard missing ${source}`);
    assert.ok(contract.canonicalSources.includes(source), `chat-learning preflight missing ${source}`);
  }
});

test('execution addendum preserves proven capabilities separately from external hard boundaries', () => {
  const addendum = json(ADDENDUM);
  const writers = addendum.provenCapabilities.find(x => x.id === 'repository-writers-7-of-7-parity-rollback');
  assert.equal(writers?.status, 'PROVEN');
  const mainProtection = addendum.externalHardBoundaries.find(x => x.id === 'github-native-main-protection');
  assert.equal(mainProtection?.status, 'BLOCKED_EXTERNAL');
  assert.equal(mainProtection?.mustNotBeInferredFromInternalCi, true);
  const makeCapacity = addendum.externalHardBoundaries.find(x => x.id === 'make-runtime-capacity');
  assert.equal(makeCapacity?.status, 'BLOCKED_EXTERNAL');
  assert.equal(makeCapacity?.canonicalPersistencePreserved, true);
});
