import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('canonical docs/learning changes are governed Brain work without executable lanes', () => {
  const policy = JSON.parse(fs.readFileSync('config/brain-delivery-system.json', 'utf8'));
  const path = 'docs/learning/known-error-preflight-contract.md';
  const plan = createDeliveryPlan({
    changedPaths: [path],
    headSha: '1234567890abcdef1234567890abcdef12345678',
    policy,
  });

  assert.deepEqual(plan.lanes, []);
  assert.deepEqual(plan.nonExecutableSharedPaths, [path]);
  assert.equal(plan.integration.required, false);
  assert.equal(plan.changedPaths.includes(path), true);
});
