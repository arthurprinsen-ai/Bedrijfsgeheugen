import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('Superpowers release evidence is classified as non-executable shared delivery evidence', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const path = 'docs/superpowers/changes/2026-09-15-resource-business-value-release-evidence.md';
  const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abcdef1234567890', policy });
  assert.deepEqual(plan.lanes, []);
  assert.deepEqual(plan.nonExecutableSharedPaths, [path]);
  assert.equal(plan.integration.required, false);
});
