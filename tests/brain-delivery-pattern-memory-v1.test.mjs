import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePatternMemoryRoute } from '../tools/delivery/delivery-pattern-memory.mjs';

test('pattern memory selects historical regressions from matching enforcement paths', () => {
  const route = derivePatternMemoryRoute({
    changedPaths:['tools/site-shell/example.mjs'],
    learningRecords:[{
      fingerprint:'example|site-shell|v1',
      enforcement:['tools/site-shell/'],
      test_evidence:['tests/site-shell-website-release-risk.test.mjs']
    }]
  });
  assert.deepEqual(route.tests,['tests/site-shell-website-release-risk.test.mjs']);
  assert.equal(route.matches.length,1);
});

test('pattern memory ignores unrelated learning records', () => {
  const route = derivePatternMemoryRoute({
    changedPaths:['tools/delivery/example.mjs'],
    learningRecords:[{
      fingerprint:'example|portal|v1',
      enforcement:['portal-v2/'],
      test_evidence:['tests/portal-production-contract.test.mjs']
    }]
  });
  assert.deepEqual(route.tests,[]);
});

test('pattern memory merges historical replay shadow and evidence tests deterministically', () => {
  const route = derivePatternMemoryRoute({
    changedPaths:['tools/delivery/example.mjs'],
    learningRecords:[{
      fingerprint:'example|delivery|v1',
      enforcement:['tools/delivery/'],
      test_evidence:['tests/z.test.mjs'],
      evaluation:{historical_replay:['tests/a.test.mjs'],shadow:['tests/b.test.mjs']},
      evidence:{tests:['tests/c.test.mjs']}
    }]
  });
  assert.deepEqual(route.tests,['tests/a.test.mjs','tests/b.test.mjs','tests/c.test.mjs','tests/z.test.mjs']);
});

test('pattern memory stays bounded', () => {
  const records = Array.from({length:20},(_,i)=>({
    fingerprint:`f-${i}`,
    enforcement:['tools/delivery/'],
    test_evidence:[`tests/t${String(i).padStart(2,'0')}.test.mjs`]
  }));
  const route = derivePatternMemoryRoute({changedPaths:['tools/delivery/a.mjs'],learningRecords:records,maxTests:5});
  assert.equal(route.tests.length,5);
  assert.equal(route.bounded,true);
});

test('pattern memory never selects non-test evidence as executable test', () => {
  const route = derivePatternMemoryRoute({
    changedPaths:['tools/delivery/a.mjs'],
    learningRecords:[{
      fingerprint:'f-x',
      enforcement:['tools/delivery/'],
      test_evidence:['docs/changes/x.md','scripts/brain/x.mjs','tests/valid.test.mjs']
    }]
  });
  assert.deepEqual(route.tests,['tests/valid.test.mjs']);
});
