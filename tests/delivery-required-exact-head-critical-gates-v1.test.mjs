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


test('CodeQL exact-head evidence is required only for paths that trigger the CodeQL workflow', async()=>{
  const workflow=await readFile('.github/workflows/required-test.yml','utf8');
  const block=workflow.slice(workflow.indexOf('Require exact-head BRAIN and CodeQL sibling workflows'),workflow.indexOf('Aggregate admission and selected lane results'));
  assert.match(block,/PR_NUMBER:/);
  assert.match(block,/pulls\/\$\{PR_NUMBER\}\/files\?per_page=100/);
  assert.match(block,/\\\.\(js\|mjs\|cjs\|ts\|tsx\)\$/);
  assert.match(block,/package\(-lock\)\?/);
  assert.match(block,/powerhouse-codeql\\\.yml/);
  assert.match(block,/CRITICAL_EXACT_HEAD_GATE_NOT_APPLICABLE:Powerhouse-CodeQL/);
  const brainIndex=block.indexOf('require_workflow "unified-brain-delivery.yml" "BRAIN"');
  const codeqlGuardIndex=block.indexOf('if grep -Eq');
  const codeqlIndex=block.indexOf('require_workflow "powerhouse-codeql.yml" "Powerhouse-CodeQL"');
  assert.ok(brainIndex>=0 && codeqlGuardIndex>brainIndex && codeqlIndex>codeqlGuardIndex);
});
