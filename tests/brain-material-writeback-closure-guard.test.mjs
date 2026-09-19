import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  evaluateMaterialWritebackClosure,
  evaluateLearningSemantics,
  MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT,
  SEMANTIC_LEARNING_CLOSURE_FINGERPRINT
} from '../scripts/brain/material-writeback-closure-guard.mjs';

test('material change fails closed when durable closure artifacts are missing',()=>{
  const result=evaluateMaterialWritebackClosure({changedPaths:['portal-v2/app.js']});
  assert.equal(result.ok,false);
  assert.equal(result.material,true);
  assert.deepEqual(result.missing,['brain_learning','activity_ledger','human_documentation']);
  assert.equal(result.fingerprint,MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT);
});

test('path-only evaluation preserves compatibility for callers without filesystem context',()=>{
  const result=evaluateMaterialWritebackClosure({changedPaths:[
    'portal-v2/app.js',
    'brain/learning/2026-09-18-example.json',
    'docs/development-ledger-events/2026-09-18-example.md',
    'docs/changes/2026-09-18-example.md',
  ]});
  assert.equal(result.ok,true);
  assert.equal(result.status,'MATERIAL_WRITEBACK_CLOSURE_PROVEN');
});

test('semantic learning requires root cause, prevention and evidence',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'bg-learning-'));
  await mkdir(path.join(root,'brain/learning'),{recursive:true});
  const relative='brain/learning/example.json';
  await writeFile(path.join(root,relative),JSON.stringify({
    fingerprint:'example-v1',
    compiler:{failure_class:'DELIVERY'},
    evaluation:{historical_replay:['tests/brain-example.test.mjs']},
    root_cause:'A concrete cause',
    prevention_rule:'A durable prevention rule',
    evidence:['regression']
  }));
  const result=evaluateLearningSemantics({learningFiles:[relative],rootDir:root});
  assert.equal(result.ok,true);
  assert.equal(result.fingerprint,SEMANTIC_LEARNING_CLOSURE_FINGERPRINT);
});

test('semantic learning fails closed on empty checkbox-style learning',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'bg-learning-empty-'));
  await mkdir(path.join(root,'brain/learning'),{recursive:true});
  const relative='brain/learning/example.json';
  await writeFile(path.join(root,relative),JSON.stringify({
    fingerprint:'example-v1',
    compiler:{failure_class:'DELIVERY'},
    evaluation:{historical_replay:['tests/brain-example.test.mjs']}
  }));
  const result=evaluateLearningSemantics({learningFiles:[relative],rootDir:root});
  assert.equal(result.ok,false);
  assert.deepEqual(result.evaluated[0].missing,['root_cause','prevention','evidence']);
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

test('terminal closure requires production evidence and skill projection before LIVE_BEWEZEN',async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/Wait for canonical production release readback/);
  assert.match(workflow,/Wait for canonical learning to skill projection/);
  assert.match(workflow,/outcome_evidence:true/);
  assert.match(workflow,/verified:true/);
  assert.match(workflow,/Terminal-State: LIVE_BEWEZEN/);
});

test('continuity and delivery skills make semantic closure a runtime obligation, not advice',async()=>{
  const continuity=await readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
  const delivery=await readFile('.agents/skills/powerhouse-delivery-concurrency/SKILL.md','utf8');
  for(const source of [continuity,delivery]){
    assert.match(source,/powerhouse\|material-run\|closure-artifacts\|required\|v1/);
    assert.match(source,/powerhouse\|error-live\|semantic-learning-closure\|required\|v2/);
    assert.match(source,/root cause/i);
    assert.match(source,/prevention/i);
    assert.match(source,/skill projection/i);
  }
});
