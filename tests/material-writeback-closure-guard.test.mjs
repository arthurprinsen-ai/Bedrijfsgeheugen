import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateMaterialWritebackClosure, MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT } from '../scripts/brain/material-writeback-closure-guard.mjs';

test('material change fails closed when durable closure artifacts are missing',()=>{
  const result=evaluateMaterialWritebackClosure({changedPaths:['portal-v2/app.js']});
  assert.equal(result.ok,false);
  assert.equal(result.material,true);
  assert.deepEqual(result.missing,['brain_learning','activity_ledger','human_documentation']);
  assert.equal(result.fingerprint,MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT);
});

test('material change passes only with learning, ledger and human documentation in same candidate',()=>{
  const result=evaluateMaterialWritebackClosure({changedPaths:[
    'portal-v2/app.js',
    'brain/learning/2026-09-18-example.json',
    'docs/development-ledger-events/2026-09-18-example.md',
    'docs/changes/2026-09-18-example.md',
  ]});
  assert.equal(result.ok,true);
  assert.equal(result.status,'MATERIAL_WRITEBACK_CLOSURE_PROVEN');
  assert.equal(result.evidence.brain_learning.length,1);
  assert.equal(result.evidence.activity_ledger.length,1);
  assert.equal(result.evidence.human_documentation.length,1);
});

test('closure-only reconciliation does not recursively demand another closure bundle',()=>{
  const result=evaluateMaterialWritebackClosure({changedPaths:[
    'brain/learning/2026-09-18-example.json',
    'docs/development-ledger-events/2026-09-18-example.md',
    'docs/learning/2026-09-18-example.md',
  ]});
  assert.equal(result.ok,true);
  assert.equal(result.material,false);
  assert.equal(result.status,'NO_MATERIAL_DELTA');
});

test('Required gate executes material writeback closure guard before lane fan-out',async()=>{
  const workflow=await readFile('.github/workflows/required-test.yml','utf8');
  const guard=workflow.indexOf('Enforce material writeback closure');
  const backend=workflow.indexOf('\n  backend:');
  assert.ok(guard>0,'material writeback closure gate missing');
  assert.ok(backend>guard,'closure gate must execute in preflight before release lane fan-out');
  assert.match(workflow,/material-writeback-closure-guard\.mjs/);
});

test('continuity and delivery skills make closure a runtime obligation, not advice',async()=>{
  const continuity=await readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
  const delivery=await readFile('.agents/skills/powerhouse-delivery-concurrency/SKILL.md','utf8');
  for(const source of [continuity,delivery]){
    assert.match(source,/powerhouse\|material-run\|closure-artifacts\|required\|v1/);
    assert.match(source,/Brain learning/i);
    assert.match(source,/activity.*ledger/i);
    assert.match(source,/human.*documentation/i);
  }
});
