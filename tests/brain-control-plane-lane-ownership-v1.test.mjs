import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';
import { deriveRequiredTestSuites } from '../tools/delivery-required-test-suites.mjs';

const policy=JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));

function suitesFor(paths){
  const plan=createDeliveryPlan({changedPaths:paths,headSha:'a'.repeat(40),policy});
  return deriveRequiredTestSuites({lanes:plan.lanes.map(lane=>lane.id)});
}

test('generic scripts/brain control-plane work is backend-owned and never fans out to product lanes',()=>{
  assert.deepEqual(suitesFor(['scripts/brain/test-chat-learning-preflight-compiler.mjs']),{
    shared:true,backend:true,portal:false,website:false,automation:false
  });
});

test('explicit automation ownership inside scripts/brain still overrides generic backend ownership',()=>{
  assert.deepEqual(suitesFor(['scripts/brain/autonomous-engineering-fabric-v3.mjs']),{
    shared:true,backend:false,portal:false,website:false,automation:true
  });
});

test('chat-learning regression bundle stays off portal and website browser lanes',()=>{
  const suites=suitesFor([
    'brain/learning/example.json',
    'docs/changes/example.md',
    'docs/development-ledger-events/example.md',
    'scripts/brain/test-chat-learning-preflight-compiler.mjs',
    'tests/brain-control-plane-lane-ownership-v1.test.mjs'
  ]);
  assert.equal(suites.backend,true);
  assert.equal(suites.portal,false);
  assert.equal(suites.website,false);
});
