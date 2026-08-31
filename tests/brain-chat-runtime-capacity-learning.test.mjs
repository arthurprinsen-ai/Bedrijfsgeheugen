import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const INCIDENT_PATH = 'brain/learning/incidents/make-team-paused-capacity-2026-08-31.json';
const RULES_PATH = 'config/delivery-prevention-rules.json';
const GUARD_PATH = 'config/chat-learning-completeness-guard.json';

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('Make paused-capacity runtime writeback failure is persisted as canonical Brain learning', async () => {
  const incident = await json(INCIDENT_PATH);
  assert.equal(incident.fingerprint, 'make|capacity|team-paused-runtime-learning-writeback');
  assert.equal(incident.status, 'GUARDED');
  assert.equal(incident.preventionRule, 'BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE');
  assert.equal(incident.canonicalPersistencePreserved, true);
  assert.equal(incident.runtimeProjectionDeferred, true);
  assert.match(incident.evidence, /organization or team is paused/i);
});

test('Make capacity learning is bound into chat completion and an active prevention rule', async () => {
  const [guard, rules] = await Promise.all([json(GUARD_PATH), json(RULES_PATH)]);
  assert.ok(guard.requiredCanonicalSources.includes(INCIDENT_PATH));
  assert.ok(rules.rules.some(rule => rule.id === 'BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE' && rule.active === true));
});
