import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const workflow = fs.readFileSync('.github/workflows/menu-balk-fix.yml', 'utf8');

test('menu writer creates a candidate proof even when no menu content changes', () => {
  assert.match(workflow, /no-op-candidate-flow/);
  assert.match(workflow, /brain\/evidence\/writer-canary\/menu-balk-fix-/);
  assert.doesNotMatch(workflow, /changed=false/);
  assert.match(workflow, /echo "changed=true"/);
});

test('menu writer still hands exact PR identity to shadow verification', () => {
  assert.match(workflow, /pr_number=\"\$pr_number\"/);
  assert.match(workflow, /head_sha=\"\$pr_head_sha\"/);
  assert.match(workflow, /repo-writer-candidate-shadow\.yml/);
  assert.match(workflow, /candidate_pr=\$\{\{ steps\.candidate_pr\.outputs\.pr_number \}\}/);
  assert.match(workflow, /candidate_head_sha=\$\{\{ steps\.candidate_pr\.outputs\.head_sha \}\}/);
});
