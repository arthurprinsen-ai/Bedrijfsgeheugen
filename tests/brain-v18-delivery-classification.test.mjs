import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('historical V18 build tools are classified as website delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['tools/bouw-v18-production-core.mjs', 'tools/bouw-v18-production.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abcdef1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['website'], `${path} must be website delivery work`);
  }
});
