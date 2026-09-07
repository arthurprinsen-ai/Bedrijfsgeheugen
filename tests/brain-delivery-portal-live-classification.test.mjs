import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('production customer portal route, shell and routing guard are portal delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['_redirects', 'portal-live/index.html', 'tests/customer-portal-routing.test.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'portal1234567890ab', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['portal'], `${path} must be portal delivery work`);
  }
});
