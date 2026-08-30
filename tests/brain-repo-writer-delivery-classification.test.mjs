import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));

test('repo-writer governance and regression paths classify into backend delivery', () => {
  const plan = createDeliveryPlan({
    changedPaths: [
      'scripts/ci/repo-writer-policy.mjs',
      'tests/repo-writer-menu-canary-policy.test.mjs',
      'tests/repo-writer-shadow.test.mjs'
    ],
    headSha: 'a'.repeat(40),
    policy
  });

  assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend']);
  assert.deepEqual(plan.changedPaths, [
    'scripts/ci/repo-writer-policy.mjs',
    'tests/repo-writer-menu-canary-policy.test.mjs',
    'tests/repo-writer-shadow.test.mjs'
  ]);
});
