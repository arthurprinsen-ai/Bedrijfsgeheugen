import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('canonical docs/learning changes are shared Brain governance, never unclassified', () => {
  const policy = JSON.parse(fs.readFileSync('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: ['docs/learning/known-error-preflight-contract.md'],
    headSha: '1234567890abcdef1234567890abcdef12345678',
    policy,
  });

  assert.deepEqual(
    plan.lanes.map((lane) => lane.id),
    ['automation', 'backend', 'portal', 'website'],
  );
  assert.equal(plan.changedPaths.includes('docs/learning/known-error-preflight-contract.md'), true);
});
