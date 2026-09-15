import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('production release learning is canonical non-executable Brain knowledge', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const path = 'docs/learning/production-release-learning.md';
  const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0ffee1234567890', policy });

  assert.deepEqual(plan.lanes, []);
  assert.deepEqual(plan.nonExecutableSharedPaths, [path]);
  assert.equal(plan.integration.required, false);
});

test('production release learning forbids false live claims and preserves exact-SHA proof', async () => {
  const contract = await readFile('docs/learning/production-release-learning.md', 'utf8');

  assert.match(contract, /merge state, CI success, preview success, or Netlify build readiness alone/);
  assert.match(contract, /exact expected commit SHA/);
  assert.match(contract, /promotion_required/);
  assert.match(contract, /Only level 1 is sufficient to close a release as live/);
});
