import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('AI Modelwijzer root page is classified as website delivery work', async()=>{
  const policy=JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
  const plan=createDeliveryPlan({
    changedPaths:['ai-modelwijzer.html'],
    headSha:'decafbad12345678',
    policy
  });
  assert.deepEqual(plan.lanes.map(l=>l.id),['website']);
});
