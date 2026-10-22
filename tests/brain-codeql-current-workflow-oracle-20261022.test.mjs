import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const active = '.github/workflows/codeql.yml';
const retired = '.github/workflows/powerhouse-codeql.yml';
const consumers = [
  'tests/brain-ci-critical-path-acceleration-v2.test.mjs',
  'tests/brain-rocket-delivery-v1.test.mjs'
];

test('BRAIN CodeQL oracles follow active protected matrix workflow, not retired scope filter', () => {
  assert.equal(fs.existsSync(retired), false, 'Removed legacy CodeQL workflow must not be recreated');
  const yaml = fs.readFileSync(active, 'utf8');
  assert.match(yaml, /name: Powerhouse CodeQL/);
  assert.match(yaml, /pull_request:[\s\S]*merge_group:[\s\S]*push:/);
  assert.match(yaml, /merge_group:[\s\S]*types: \[checks_requested\]/);
  assert.match(yaml, /permissions:[\s\S]*security-events: write/);
  assert.match(yaml, /group: powerhouse-codeql-/);
  assert.match(yaml, /cancel-in-progress: true/);
  assert.match(yaml, /language: \[javascript-typescript, python\]/);
  assert.match(yaml, /github\/codeql-action\/init@v4/);
  assert.match(yaml, /github\/codeql-action\/analyze@v4/);
  assert.match(yaml, /queries: security-extended/);
  assert.match(yaml, /Upload CodeQL SARIF evidence/);
  assert.doesNotMatch(yaml, /github\.run_id/);
  for (const consumer of consumers) {
    const testSource = fs.readFileSync(consumer, 'utf8');
    assert.ok(testSource.includes(active), consumer + ' must read current CodeQL authority');
    assert.ok(!testSource.includes(retired), consumer + ' must not read retired CodeQL workflow');
  }
});
