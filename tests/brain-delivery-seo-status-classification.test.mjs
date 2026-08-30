import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('seo-status.json is classified into the website delivery lane', () => {
  const policy = JSON.parse(fs.readFileSync('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: ['seo-status.json'],
    headSha: '0123456789abcdef0123456789abcdef01234567',
    policy,
  });

  assert.deepEqual(plan.lanes.map((lane) => lane.id), ['website']);
});
