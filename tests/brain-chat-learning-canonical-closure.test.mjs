import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

test('primary chat-learning preflight directly loads completeness and browser guards', async () => {
  const source = await readFile('tools/delivery-preflight.mjs', 'utf8');
  assert.match(source, /chat-learning-completeness-guard\.json/);
  assert.match(source, /browser-evidence-guard-contract\.json/);

  const decision = await loadDeliveryPreflight({ component: 'shared' });
  const guarded = new Set(decision.reusedGuards);
  assert.ok(guarded.has('learning|completion|material-learning-only-in-chat'));
  assert.ok(guarded.has('connector|mutation|probe-created-unwanted-artifacts'));
  assert.ok(guarded.has('browser-evidence|launchagent|node-path-missing'));
  assert.ok(guarded.has('browser-evidence|gate|fail-open'));
});

test('primary preflight reuses completeness-addendum incident lessons', async () => {
  const source = await readFile('tools/delivery-preflight.mjs', 'utf8');
  assert.match(source, /chat-completeness-addendum-2026-08-30\.json/);

  const decision = await loadDeliveryPreflight({ component: 'shared' });
  const reused = new Set(decision.reusedLessons);
  assert.ok(reused.has('learning|canonical-artifact|reference-path-drift-v1'));
  assert.ok(reused.has('connector|mutation|wrong-tool-or-resource-selected-v1'));
  assert.ok(reused.has('make|multi-agent-context-learning-credit-storm|2026-08-30-v1'));
});

test('canonical completeness guard remains fail-closed for chat-only learning and probe mutations', async () => {
  const guard = JSON.parse(await readFile('config/chat-learning-completeness-guard.json', 'utf8'));
  assert.equal(guard.failClosed, true);
  assert.equal(guard.completionPolicy.blockIfMaterialLearningOnlyInChat, true);
  assert.equal(guard.completionPolicy.requirePersistentSharedMemoryWriteback, true);
  assert.equal(guard.connectorMutationSafety.noProbeMutations, true);
  assert.equal(guard.connectorMutationSafety.requireReadbackAfterMutation, true);
});
