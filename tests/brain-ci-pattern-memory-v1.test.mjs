import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import policy from '../config/powerhouse-ci-pattern-memory-v1.json' with { type:'json' };
import { buildCiPatternMemory, applyPatternMemoryToPlan } from '../tools/delivery/ci-pattern-memory.mjs';

test('builds hot-file memory from repeatedly failing pull requests', () => {
  const memory = buildCiPatternMemory({
    policy,
    runs:[
      {conclusion:'failure',pull_requests:[{number:1}]},
      {conclusion:'failure',pull_requests:[{number:2}]},
      {conclusion:'success',pull_requests:[{number:3}]}
    ],
    jobs:[
      {workflow:'Required test',job:'website / browser',conclusion:'failure'},
      {workflow:'Required test',job:'website / browser',conclusion:'failure'}
    ],
    prFiles:{
      1:['portal-v2/app.js','shared.mjs'],
      2:['portal-v2/app.js','other.mjs'],
      3:['portal-v2/app.js']
    }
  });
  assert.deepEqual(memory.hotFiles.map(item=>item.path), ['portal-v2/app.js']);
  assert.deepEqual(memory.failurePatterns, [{
    workflow:'Required test',
    job:'website / browser',
    occurrences:2,
    riskBoost:1
  }]);
});

test('does not promote one-off failures into pattern memory', () => {
  const memory = buildCiPatternMemory({
    policy,
    runs:[{conclusion:'failure',pull_requests:[{number:9}]}],
    jobs:[{workflow:'Required test',job:'backend',conclusion:'failure'}],
    prFiles:{9:['tools/x.mjs']}
  });
  assert.equal(memory.hotFiles.length, 0);
  assert.equal(memory.failurePatterns.length, 0);
});

test('hot file escalates adaptive risk by one class and keeps fail-closed suite', () => {
  const plan = {risk:'R1',fullSharedSuite:false,tests:[]};
  const memory = {hotFiles:[{path:'docs/risky.md',failures:3}]};
  const result = applyPatternMemoryToPlan({plan,changedPaths:['docs/risky.md'],memory});
  assert.equal(result.risk,'R2');
  assert.equal(result.fullSharedSuite,true);
  assert.equal(result.ciPatternMemory.escalated,true);
});

test('non-hot paths preserve original adaptive plan', () => {
  const plan = {risk:'R1',fullSharedSuite:false,tests:[]};
  const memory = {hotFiles:[{path:'tools/hot.mjs',failures:4}]};
  const result = applyPatternMemoryToPlan({plan,changedPaths:['docs/cold.md'],memory});
  assert.equal(result.risk,'R1');
  assert.equal(result.fullSharedSuite,false);
  assert.equal(result.ciPatternMemory.escalated,false);
});

test('CI Intelligence emits pattern memory and Required restores it before bundle compile', async () => {
  const intelligence = await readFile('scripts/brain/powerhouse-ci-intelligence.mjs','utf8');
  const workflow = await readFile('.github/workflows/powerhouse-ci-intelligence.yml','utf8');
  const required = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(intelligence, /pattern-memory\.json/);
  assert.match(workflow, /artifacts\/ci-intelligence\/pattern-memory\.json/);
  assert.match(required, /Restore latest CI pattern memory/);
  assert.match(required, /CI_PATTERN_MEMORY_PATH/);
  assert.match(required, /powerhouse-ci-intelligence-\$run_id/);
});
