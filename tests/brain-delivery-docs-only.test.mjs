import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('governed docs learning changes are successful non-executable delivery no-ops', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const path = 'docs/learning/learning-plane-cost-guard.md';
  const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abcdef1234567890', policy });

  assert.deepEqual(plan.changedPaths, [path]);
  assert.deepEqual(plan.lanes, []);
  assert.equal(plan.integration.required, false);
  assert.deepEqual(plan.nonExecutableSharedPaths, [path]);
});
