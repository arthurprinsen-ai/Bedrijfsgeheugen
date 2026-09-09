import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('Powerhouse social learning runtime and regression tests classify as backend delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const backendPaths = [
    'tests/social-learning-model.test.mjs',
    'tests/social-learning-store.test.mjs',
    'tests/social-outcome-ingest.test.mjs',
    'netlify/functions/social-learning-evaluate.mjs',
    'netlify/functions/social-learning-context.mjs',
    'supabase/functions/social-learning-store/index.ts',
    'supabase/migrations/20260909095000_powerhouse_social_learning_v1.sql'
  ];

  for (const path of backendPaths) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'ab12cd34ef567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend'], `${path} must be backend delivery work`);
  }
});
