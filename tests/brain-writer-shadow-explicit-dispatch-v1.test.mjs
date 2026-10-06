import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');

test('writer shadow is dispatch-only and every governed writer dispatches exact PR identity', async () => {
  const shadow = await read('.github/workflows/repo-writer-candidate-shadow.yml');
  assert.match(shadow, /^\s*workflow_dispatch:/m);
  assert.doesNotMatch(shadow, /^\s*pull_request:/m);
  assert.match(shadow, /GITHUB_PR_BASE_SHA:\s*\$\{\{ inputs\.base_sha \}\}/);
  assert.match(shadow, /GITHUB_PR_HEAD_SHA:\s*\$\{\{ inputs\.head_sha \}\}/);
  assert.match(shadow, /REPO_WRITER_HEAD_REF:\s*\$\{\{ inputs\.candidate_branch \}\}/);

  const paths = [
    '.github/workflows/menu-balk-fix.yml',
    '.github/workflows/approved-central-blog.yml',
    '.github/workflows/blog-bijwerken.yml',
    '.github/workflows/regelgeving-bijwerken.yml',
    '.github/workflows/seo-controle.yml',
    '.github/workflows/paginacontrole.yml',
    '.github/workflows/weekblog.yml',
  ];
  for (const path of paths) {
    const workflow = await read(path);
    assert.match(workflow, /gh workflow run repo-writer-candidate-shadow\.yml/);
    assert.match(workflow, /-f pr_number=/);
    assert.match(workflow, /-f base_sha=/);
    assert.match(workflow, /-f head_sha=/);
    assert.match(workflow, /-f candidate_branch=/);
  }
});
