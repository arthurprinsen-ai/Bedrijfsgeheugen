import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('primary chat-learning preflight loads all current canonical guard sources', async () => {
  const contract = JSON.parse(await readFile('config/brain-chat-learning-contract.json', 'utf8'));
  for (const source of [
    'config/chat-learning-completeness-guard.json',
    'config/browser-evidence-guard-contract.json',
    'docs/development-browser-evidence-candidate-chrome.md'
  ]) {
    assert.ok(contract.canonicalSources.includes(source), `missing canonical learning source ${source}`);
  }
});

test('canonical completeness guard remains fail-closed for chat-only learning and probe mutations', async () => {
  const guard = JSON.parse(await readFile('config/chat-learning-completeness-guard.json', 'utf8'));
  assert.equal(guard.failClosed, true);
  assert.equal(guard.completionPolicy.blockIfMaterialLearningOnlyInChat, true);
  assert.equal(guard.completionPolicy.requirePersistentSharedMemoryWriteback, true);
  assert.equal(guard.connectorMutationSafety.noProbeMutations, true);
  assert.equal(guard.connectorMutationSafety.requireReadbackAfterMutation, true);
});
