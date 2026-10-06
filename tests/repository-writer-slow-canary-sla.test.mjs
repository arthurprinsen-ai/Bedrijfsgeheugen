import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('operational writer verification uses a bounded synchronous wait then yields externally', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  const dispatch = workflow.split('  dispatch-writer-candidate:')[1] || '';
  assert.match(dispatch, /timeout-minutes:\s*10/);
  assert.match(dispatch, /seq\\s+1\\s+6/);
  assert.match(dispatch, /sleep\s+5/);
  assert.match(dispatch, /WAITING_EXTERNAL:WRITER_PR_NOT_MATERIALIZED/);
  assert.match(dispatch, /AMBIGUOUS_WRITER_PR/);
});