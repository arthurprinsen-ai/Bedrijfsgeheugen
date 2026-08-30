import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('future outcome obligation runtime files are automatically backend governed', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of [
    'tools/outcome-obligation-executor.mjs',
    'tools/outcome-obligation-future-adapter.mjs',
    'tests/brain-outcome-obligation-runtime.test.mjs',
  ]) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy });
    assert.ok(plan.lanes.some(lane => lane.id === 'backend'), `${path} must be backend delivery work`);
  }
});
