import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/powerhouse-skill-projection.yml','utf8');

test('skill projection bootstraps package dependencies before learning replay',()=>{
  const install=workflow.indexOf('Install projection-test dependencies');
  const canonicalize=workflow.indexOf('Evaluate changed learning before canonicalization');
  assert.ok(install>=0,'dependency bootstrap step missing');
  assert.ok(canonicalize>install,'dependency bootstrap must run before canonicalization replay');
  assert.match(workflow,/npm install --ignore-scripts --no-audit --no-fund/);
});
