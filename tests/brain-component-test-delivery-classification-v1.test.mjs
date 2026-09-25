import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDeliveryPlan} from '../tools/brain-delivery-system.mjs';

test('component tests are classified as website delivery work',async()=>{
  const policy=JSON.parse(await readFile(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));
  const plan=createDeliveryPlan({
    changedPaths:['tests/components/pricing.test.mjs'],
    headSha:'decafbad12345678',
    policy
  });
  assert.deepEqual(plan.lanes.map(lane=>lane.id),['website']);
});
