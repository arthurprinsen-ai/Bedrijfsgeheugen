import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');

test('delivery hygiene loads an explicitly superseded predecessor even when it is closed',()=>{
  assert.match(workflow,/const candidateMetadata = parseDeliveryMetadata\(pr\.body \|\| ''\)/);
  assert.match(workflow,/candidateMetadata\.supersedes !== null/);
  assert.match(workflow,/pulls\/\$\{candidateMetadata\.supersedes\}/);
  assert.match(workflow,/candidatePool\.push\(predecessor\)/);
  assert.match(workflow,/for \(const item of candidatePool\)/);
});

test('open PR discovery remains the default candidate pool',()=>{
  assert.match(workflow,/pulls\?state=open&per_page=100/);
  assert.match(workflow,/const candidatePool = \[\.\.\.open\]/);
});
