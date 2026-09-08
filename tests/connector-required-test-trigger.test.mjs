import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Required test can be explicitly retriggered when a draft becomes ready',async()=>{
  const workflow=await readFile(new URL('../.github/workflows/required-test.yml',import.meta.url),'utf8');
  assert.match(workflow,/types:\s*\[opened, synchronize, reopened, ready_for_review\]/);
  assert.match(workflow,/workflow_dispatch:/);
});
