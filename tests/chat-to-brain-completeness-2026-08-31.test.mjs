import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const checkpointPath = 'brain/learning/chat-completeness-checkpoint-2026-08-31.json';
const contractPath = 'config/brain-chat-learning-contract.json';
const guardPath = 'config/chat-learning-completeness-guard.json';

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
  'agent-fabric|completion|local-resolved-bypasses-global-obligations',
];

test('all durable learnings from the chat are indexed in canonical BRAIN memory, not left chat-only', async () => {
  const [checkpoint, contract, guard] = await Promise.all([
    readFile(checkpointPath, 'utf8').then(JSON.parse),
    readFile(contractPath, 'utf8').then(JSON.parse),
    readFile(guardPath, 'utf8').then(JSON.parse),
  ]);

  assert.equal(checkpoint.version, 'CHAT-COMPLETENESS-CHECKPOINT-2026-08-31-v1');
  assert.equal(checkpoint.chatOnlyMaterialLearningRemaining, 0);
  assert.equal(checkpoint.policy?.chatIsNotCanonicalMemory, true);
  assert.equal(checkpoint.policy?.futureAgentsMustUseCanonicalBrainSources, true);

  assert.ok(contract.canonicalSources.includes(checkpointPath));
  assert.ok(guard.requiredCanonicalSources.includes(checkpointPath));

  const indexed = new Set(checkpoint.learnings.map((item) => item.fingerprint));
  for (const fingerprint of requiredFingerprints) {
    assert.ok(indexed.has(fingerprint), `missing durable chat learning ${fingerprint}`);
  }

  for (const item of checkpoint.learnings) {
    assert.equal(item.chatOnly, false, `learning must not remain chat-only: ${item.fingerprint}`);
    assert.ok(Array.isArray(item.canonicalSources) && item.canonicalSources.length > 0,
      `learning must point to canonical BRAIN sources: ${item.fingerprint}`);
    assert.ok(item.preventionRule || item.regressionContract,
      `learning needs prevention or regression coverage: ${item.fingerprint}`);
  }
});
