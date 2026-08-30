import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

test('chat-learning and Make agent-learning contract tests are classified as backend governance work', () => {
  for (const path of [
    'tests/chat-learning-future-contract.test.mjs',
    'tests/make-agent-learning-future-contract.test.mjs'
  ]) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend'], `${path} must be backend governance delivery work`);
  }
});

test('unrelated unknown test families still fail closed', () => {
  assert.throws(
    () => createDeliveryPlan({ changedPaths:['tests/unowned-future-system.test.mjs'], headSha:'abc123def4567890', policy }),
    /unclassified delivery path/
  );
});
