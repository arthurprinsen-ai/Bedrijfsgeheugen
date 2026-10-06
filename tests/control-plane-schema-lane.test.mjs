import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));

test('repository schemas are classified as automation control-plane work', () => {
  const plan = createDeliveryPlan({
    changedPaths: ['schemas/delivery-evidence.schema.json'],
    headSha: 'a'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation']);
});
