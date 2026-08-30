import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('chat-learning preflight canonically loads completeness and browser guards', async () => {
  const contract = JSON.parse(await readFile('config/brain-chat-learning-contract.json', 'utf8'));
  const required = [
    'config/chat-learning-completeness-guard.json',
    'config/browser-evidence-guard-contract.json',
    'docs/development-browser-evidence-candidate-chrome.md'
  ];
  for (const source of required) {
    assert.ok(contract.canonicalSources.includes(source), `missing canonical learning source ${source}`);
  }
});

test('completion guard stays fail-closed and links persistent shared memory', async () => {
  const guard = JSON.parse(await readFile('config/chat-learning-completeness-guard.json', 'utf8'));
  assert.equal(guard.failClosed, true);
  assert.equal(guard.completionPolicy.blockIfMaterialLearningOnlyInChat, true);
  assert.equal(guard.completionPolicy.requirePersistentSharedMemoryWriteback, true);
  assert.equal(guard.connectorMutationSafety.noProbeMutations, true);
  assert.equal(guard.connectorMutationSafety.requireReadbackAfterMutation, true);
});
