import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));
const headSha = '0123456789abcdef0123456789abcdef01234567';

test('Powerhouse assurance surfaces are classified as shared delivery control-plane work', () => {
  const plan = createDeliveryPlan({
    changedPaths: ['powerhouse/assurance/portal-v2-parity.json'],
    headSha,
    policy,
  });

  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation', 'backend', 'portal', 'website']);
  assert.equal(plan.changedPaths.includes('powerhouse/assurance/portal-v2-parity.json'), true);
});
