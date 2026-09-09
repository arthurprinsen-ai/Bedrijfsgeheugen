import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const CONTENT_LEARNING_PATHS = [
  'lib/content-learning/ga4-observations.mjs',
  'lib/content-learning/post-features.mjs',
  'lib/content-learning/rule-preflight.mjs',
  'tests/content-learning-ga4-observations.test.mjs',
  'tests/content-learning-post-features.test.mjs',
  'tests/content-learning-rule-preflight.test.mjs',
];

test('content-learning runtime and regression tests are bounded backend delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

  for (const path of CONTENT_LEARNING_PATHS) {
    const plan = createDeliveryPlan({
      changedPaths: [path],
      headSha: 'c0117e4a7e123456',
      policy,
    });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend'], `${path} must be backend delivery work`);
  }

  assert.throws(
    () => createDeliveryPlan({
      changedPaths: ['lib/unowned-future-runtime.mjs'],
      headSha: 'c0117e4a7e123456',
      policy,
    }),
    /unclassified delivery path/,
    'classification must remain fail-closed outside the bounded content-learning family',
  );
});
