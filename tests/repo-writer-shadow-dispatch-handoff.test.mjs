import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('writer shadow supports explicit workflow_dispatch with immutable PR identity', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  for (const input of ['pr_number', 'candidate_branch', 'candidate_head_sha', 'candidate_base_sha']) {
    assert.match(workflow, new RegExp(`${input}:`));
  }
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /inputs\.candidate_head_sha/);
  assert.match(workflow, /inputs\.candidate_base_sha/);
});

test('menu writer explicitly dispatches shadow after its own candidate PR creation', async () => {
  const workflow = await readFile('.github/workflows/menu-balk-fix.yml', 'utf8');
  assert.match(workflow, /actions:\s*write/);
  assert.match(workflow, /gh workflow run repo-writer-candidate-shadow\.yml/);
  assert.match(workflow, /candidate_head_sha/);
  assert.match(workflow, /candidate_base_sha/);
  assert.match(workflow, /pr_number/);
});
