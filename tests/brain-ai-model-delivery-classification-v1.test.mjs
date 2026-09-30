import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
const headSha='1234567890abcdef1234567890abcdef12345678';

test('AI Modelwijzer public/data/tool paths classify into the website lane',()=>{
  const changedPaths=[
    'ai-modelwijzer.html',
    'data/ai-model-catalog-v1.json',
    'tools/ai-model-intelligence-audit.mjs',
    'tests/ai-model-intelligence-page.test.mjs'
  ];
  const plan=createDeliveryPlan({changedPaths,headSha,policy});
  assert.ok(plan.lanes.some(l=>l.id==='website'));
});

test('AI Modelwijzer classifier leaves no unclassified delivery path',()=>{
  assert.doesNotThrow(()=>createDeliveryPlan({
    changedPaths:['data/ai-model-catalog-v1.json','tools/ai-modelwijzer-netlify-build-check.mjs'],
    headSha,
    policy
  }));
});