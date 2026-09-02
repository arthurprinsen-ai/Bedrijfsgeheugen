import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy=JSON.parse(fs.readFileSync(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));
const sha='1234567890abcdef1234567890abcdef12345678';

test('customer portal identity runtime and regression paths belong to portal delivery',()=>{
  const plan=createDeliveryPlan({
    changedPaths:[
      'tools/bouw-powerhouse-auth.mjs',
      'tools/fix-netlify-identity-token-flow.mjs',
      'tests/netlify-identity-recovery-flow.test.mjs'
    ],
    headSha:sha,
    policy
  });
  assert.ok(plan.lanes.some(lane=>lane.id==='portal'));
});

test('incident documentation is classified without creating executable work by itself',()=>{
  const plan=createDeliveryPlan({changedPaths:['docs/changes/example.md'],headSha:sha,policy});
  assert.equal(plan.lanes.length,0);
  assert.deepEqual(plan.nonExecutableSharedPaths,['docs/changes/example.md']);
});
