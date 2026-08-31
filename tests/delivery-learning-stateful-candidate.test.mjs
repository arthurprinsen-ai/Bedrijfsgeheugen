import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('novel delivery failures are reconciled statefully without broadening Unified BRAIN write permissions', async () => {
  const unified = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
  const reconciler = await readFile('.github/workflows/delivery-learning-candidate-reconcile.yml', 'utf8');
  const tool = await readFile('tools/delivery-learning-candidate-reconcile.mjs', 'utf8');

  assert.doesNotMatch(unified, /permissions:[\s\S]{0,120}issues:\s*write/);
  assert.match(unified, /delivery-learning-route-/);

  assert.match(reconciler, /workflow_run:/);
  assert.match(reconciler, /Unified Brain Delivery/);
  assert.match(reconciler, /actions:\s*read/);
  assert.match(reconciler, /issues:\s*write/);
  assert.match(reconciler, /brain-delivery-failure-/);
  assert.match(reconciler, /delivery-learning-candidate-reconcile\.mjs/);
  assert.doesNotMatch(reconciler, /Make|Notion|openai|anthropic/i);

  for (const token of [
    'learning-candidate|',
    'UNVERIFIED',
    'REUSE_PROVEN_LESSON',
    'candidate_id',
    'fingerprint',
    'last_seen_sha',
    'last_seen_run',
    'first_seen_sha',
    'first_seen_run',
  ]) assert.match(tool, new RegExp(token.replace(/[|]/g, '\\|')));

  assert.match(tool, /existingIssue/);
  assert.match(tool, /deduplicated/);
  assert.match(tool, /signature/);
  assert.doesNotMatch(tool, /autoPromoteToProven\s*:\s*true/);
});
