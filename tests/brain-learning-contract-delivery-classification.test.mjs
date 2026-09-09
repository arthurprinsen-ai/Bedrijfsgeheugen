import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

test('chat-learning and Make agent learning/resume contract tests are classified as backend governance work', () => {
  for (const path of [
    'tests/chat-learning-future-contract.test.mjs',
    'tests/make-agent-learning-future-contract.test.mjs',
    'tests/make-agent-resume-future-contract.test.mjs'
  ]) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend'], `${path} must be backend governance delivery work`);
  }
});

test('content-learning runtime and regression tests are bounded backend delivery work', () => {
  for (const path of [
    'lib/content-learning/ga4-observations.mjs',
    'lib/content-learning/post-features.mjs',
    'lib/content-learning/rule-preflight.mjs',
    'tests/content-learning-ga4-observations.test.mjs',
    'tests/content-learning-post-features.test.mjs',
    'tests/content-learning-rule-preflight.test.mjs'
  ]) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0117e4a7e123456', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend'], `${path} must be backend delivery work`);
  }
});

test('unrelated unknown test and runtime families still fail closed', () => {
  for (const path of ['tests/unowned-future-system.test.mjs', 'lib/unowned-future-runtime.mjs']) {
    assert.throws(
      () => createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy }),
      /unclassified delivery path/,
      `${path} must remain fail closed`
    );
  }
});
