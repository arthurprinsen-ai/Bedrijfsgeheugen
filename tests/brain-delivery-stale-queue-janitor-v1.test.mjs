import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync(new URL('../.github/workflows/powerhouse-stale-actions-drain.yml', import.meta.url),'utf8');
const script=fs.readFileSync(new URL('../tools/delivery/stale-actions-drain.sh', import.meta.url),'utf8');

test('stale Actions drain runs independently every ten minutes and after its own control-plane merge',()=>{
  assert.match(workflow,/cron: '\*\/10 \* \* \* \*'/);
  assert.match(workflow,/push:\s*\n\s+branches: \[main\]/);
  assert.match(workflow,/bash tools\/delivery\/stale-actions-drain\.sh/);
  assert.match(workflow,/cancel-in-progress:\s*true/);
});

test('drainer preserves main current PR heads and terminal post-merge workflows',()=>{
  assert.match(script,/\[ "\$branch" != main \] \|\| continue/);
  assert.match(script,/current_pr_head/);
  assert.match(script,/obligation-terminal-closure\.yml/);
  assert.match(script,/powerhouse-merged-branch-cleanup\.yml/);
});

test('proven obsolete queued runs drain fast while in-progress runs get a grace window',()=>{
  assert.match(script,/MISSING_NON_MAIN_BRANCH/);
  assert.match(script,/age_seconds "\$created_at"\) -ge 60/);
  assert.match(script,/age_seconds "\$updated_at"\) -ge 300/);
  assert.match(script,/STALE_PR_HEAD/);
  assert.match(script,/MERGED_OR_CONTAINED_BRANCH/);
});

test('cancel escalation remains cancel force-cancel then delete fallback',()=>{
  assert.match(script,/actions\/runs\/\$\{run_id\}\/cancel/);
  assert.match(script,/actions\/runs\/\$\{run_id\}\/force-cancel/);
  assert.match(script,/-X DELETE "repos\/\$\{GITHUB_REPOSITORY\}\/actions\/runs\/\$\{run_id\}"/);
});
