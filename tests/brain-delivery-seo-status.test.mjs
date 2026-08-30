import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('paginacontrole seo-status output is classified in the website lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: ['seo-status.json'],
    headSha: '1234567890abcdef',
    policy,
  });

  assert.deepEqual(plan.lanes.map((lane) => lane.id), ['website']);
  assert.equal(plan.lanes[0].owner, 'agent-website-ux');
});
