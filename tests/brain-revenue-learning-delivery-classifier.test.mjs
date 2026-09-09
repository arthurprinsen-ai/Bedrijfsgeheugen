import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDeliveryPlan} from '../tools/brain-delivery-system.mjs';

test('Revenue Learning runtime, store, migration and regression tests classify as backend delivery work',async()=>{
  const policy=JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
  const paths=[
    'tests/revenue-learning-model.test.mjs',
    'tests/revenue-learning-store.test.mjs',
    'tests/revenue-learning-project.test.mjs',
    'tests/revenue-learning-evaluate.test.mjs',
    'tests/revenue-learning-context.test.mjs',
    'tests/revenue-learning-schema.test.mjs',
    'tests/revenue-learning-edge-store.test.mjs',
    'netlify/functions/revenue-learning-evaluate.mjs',
    'supabase/functions/revenue-learning-store/index.ts',
    'supabase/migrations/20260909112000_revenue_learning_layer.sql'
  ];
  for(const path of paths){
    const plan=createDeliveryPlan({changedPaths:[path],headSha:'ab12cd34ef567890',policy});
    assert.deepEqual(plan.lanes.map(l=>l.id),['backend'],`${path} must be backend delivery work`);
  }
});
