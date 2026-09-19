import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('native required context cannot turn green before exact-head BRAIN and CodeQL', async()=>{
  const workflow=await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(workflow,/actions:\s*read/);
  assert.match(workflow,/Require exact-head BRAIN and CodeQL sibling workflows/);
  assert.match(workflow,/head_sha=\$\{EXACT_HEAD_SHA\}&event=pull_request/);
  assert.match(workflow,/unified-brain-delivery\.yml/);
  assert.match(workflow,/powerhouse-codeql\.yml/);
  assert.match(workflow,/CRITICAL_EXACT_HEAD_GATE_FAILED/);
  assert.match(workflow,/CRITICAL_EXACT_HEAD_GATE_NOT_TERMINAL/);
});

test('critical gate aggregation reuses existing workflow runs instead of duplicating heavy CI', async()=>{
  const workflow=await readFile('.github/workflows/required-test.yml','utf8');
  const block=workflow.slice(workflow.indexOf('Require exact-head BRAIN and CodeQL sibling workflows'),workflow.indexOf('Aggregate admission and selected lane results'));
  assert.match(block,/gh api/);
  assert.doesNotMatch(block,/workflow dispatch|gh workflow run|node --test|npm test/i);
  assert.match(block,/sort_by\(\.created_at\) \| last/);
});
