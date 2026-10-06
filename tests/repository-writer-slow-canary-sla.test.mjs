import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('operational writer verification is explicit event-driven work, not global PR fanout', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  const dispatch = workflow.split('  dispatch-writer-candidate:')[1] || '';

  assert.match(workflow, /^\s{2}workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^\s{2}pull_request:/m);
  for (const input of ['writer:', 'base_sha:', 'verify_ref:', 'verify_sha:']) assert.match(workflow, new RegExp(input));
  for (const writer of [
    'menu-balk-fix',
    'regelgeving-bijwerken',
    'seo-controle',
    'paginacontrole',
    'approved-central-blog',
    'blog-bijwerken',
    'weekblog',
  ]) assert.match(workflow, new RegExp(writer));

  assert.match(dispatch, /timeout-minutes:\s*3/);
  assert.match(dispatch, /VERIFY_SHA_DRIFT/);
  assert.match(dispatch, /CURRENT_MAIN_SCOPE_OVERLAP/);
  assert.match(dispatch, /gh workflow run|workflow run/);
  assert.match(dispatch, /WRITER_OPERATIONAL_DISPATCHED/);

  assert.doesNotMatch(dispatch, /seq\s+1\s+72/);
  assert.doesNotMatch(dispatch, /sleep\s+5/);
  assert.doesNotMatch(dispatch, /WRITER_PR_NOT_FOUND/);
  assert.doesNotMatch(dispatch, /AMBIGUOUS_WRITER_PR/);
  assert.doesNotMatch(dispatch, /gh pr list/);
  assert.doesNotMatch(dispatch, /repo-writer-candidate-shadow\.yml/);
});
