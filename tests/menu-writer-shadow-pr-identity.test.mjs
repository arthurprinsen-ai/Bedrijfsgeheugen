import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('menu writer dispatches shadow with exact GitHub PR base and head identity', async () => {
  const workflow = await readFile('.github/workflows/menu-balk-fix.yml', 'utf8');
  assert.match(workflow, /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{pr_number\}" --jq '\.base\.sha'/);
  assert.match(workflow, /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{pr_number\}" --jq '\.head\.sha'/);
  assert.match(workflow, /echo "base_sha=\$pr_base_sha" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /echo "head_sha=\$pr_head_sha" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /BASE_SHA:\s*\$\{\{ steps\.candidate_pr\.outputs\.base_sha \}\}/);
  assert.match(workflow, /HEAD_SHA:\s*\$\{\{ steps\.candidate_pr\.outputs\.head_sha \}\}/);
});
