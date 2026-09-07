import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDeliveryPlan, deriveConflictContracts } from '../tools/brain-delivery-system.mjs';

const policy=JSON.parse(readFileSync(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));

test('_redirects is classified as both portal and website delivery impact',()=>{
  const plan=createDeliveryPlan({changedPaths:['_redirects'],headSha:'1234567890abcdef1234567890abcdef12345678',policy});
  assert.deepEqual(plan.lanes.map(x=>x.id),['portal','website']);
});

test('_redirects participates in netlify routing conflict detection',()=>{
  assert.ok(deriveConflictContracts(['_redirects'],policy).includes('netlify-routing'));
});
