import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));

test('repository schemas are classified as automation control-plane work', () => {
  const plan = createDeliveryPlan({
    changedPaths: ['schemas/delivery-evidence.schema.json'],
    headSha: 'a'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation']);
});


test('control-plane lifecycle tooling is classified as automation work', () => {
  const changedPaths = [
  "tests/build/artifact-id.test.mjs",
  "tests/netlify/ephemeral-janitor.test.mjs",
  "tests/notion/root-lifecycle.test.mjs",
  "tests/release-artifact-identity.test.mjs",
  "tests/supabase/edge-function-registry.test.mjs",
  "tools/build/artifact-id.mjs",
  "tools/netlify/ephemeral-janitor.mjs",
  "tools/notion/root-lifecycle.mjs",
  "tools/supabase/edge-function-registry.mjs"
];
  const plan = createDeliveryPlan({
    changedPaths,
    headSha: 'b'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['automation']);
  assert.deepEqual(plan.changedPaths, [...changedPaths].sort());
});
