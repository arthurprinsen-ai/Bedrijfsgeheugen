import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

test('primary chat-learning preflight directly loads completeness and browser guards', async () => {
  const source = await readFile('tools/delivery-preflight.mjs', 'utf8');
  assert.match(source, /chat-learning-completeness-guard\.json/);
  assert.match(source, /browser-evidence-guard-contract\.json/);

  const decision = await loadDeliveryPreflight({ component: 'shared' });
  const reused = new Set(decision.reusedLessons);
  assert.ok(reused.has('learning|completion|material-learning-only-in-chat'));
  assert.ok(reused.has('connector|mutation|probe-created-unwanted-artifacts'));
  assert.ok(reused.has('browser-evidence|launchagent|node-path-missing'));
  assert.ok(reused.has('browser-evidence|gate|fail-open'));
});

test('canonical completeness guard remains fail-closed for chat-only learning and probe mutations', async () => {
  const guard = JSON.parse(await readFile('config/chat-learning-completeness-guard.json', 'utf8'));
  assert.equal(guard.failClosed, true);
  assert.equal(guard.completionPolicy.blockIfMaterialLearningOnlyInChat, true);
  assert.equal(guard.completionPolicy.requirePersistentSharedMemoryWriteback, true);
  assert.equal(guard.connectorMutationSafety.noProbeMutations, true);
  assert.equal(guard.connectorMutationSafety.requireReadbackAfterMutation, true);
});
