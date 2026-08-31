import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));
const headSha = '0123456789abcdef0123456789abcdef01234567';

test('portal runtime build tools are classified in the portal delivery lane', () => {
  const plan = createDeliveryPlan({
    changedPaths: [
      'tools/bouw-release-evidence.mjs',
      'tools/portal-runtime-hook.mjs',
    ],
    headSha,
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['portal']);
});
