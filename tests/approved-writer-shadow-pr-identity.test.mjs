import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('approved writer dispatches shadow with the candidate PR exact identity', () => {
  const workflow = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');
  assert.match(workflow, /gh api .*pulls\/\$\{?number/);
  assert.match(workflow, /\.base\.sha/);
  assert.match(workflow, /\.head\.sha/);
  assert.match(workflow, /\.head\.ref/);
  assert.match(workflow, /PR_HEAD_REF_DRIFT/);
  assert.match(workflow, /echo "base_sha=\$pr_base_sha" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /echo "head_sha=\$pr_head_sha" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /BASE_SHA:\s*\$\{\{ steps\.pr\.outputs\.base_sha \}\}/);
  assert.match(workflow, /HEAD_SHA:\s*\$\{\{ steps\.pr\.outputs\.head_sha \}\}/);
});
