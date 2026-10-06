import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminalizer can replay one immutable already-merged PR with current control-plane code', async()=>{
  const workflow=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(workflow,/Resolve immutable terminalization target/);
  assert.match(workflow,/Terminal-Replay-PR:/);
  assert.match(workflow,/gh api "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$replay_pr"/);
  assert.match(workflow,/TERMINAL_REPLAY_TARGET_NOT_MERGED/);
  assert.match(workflow,/TERMINAL_REPLAY_TARGET_NOT_TERMINAL/);
  assert.match(workflow,/PR_BODY: \$\{\{ steps\.target\.outputs\.pr_body \}\}/);
  assert.match(workflow,/CANDIDATE_SHA: \$\{\{ steps\.target\.outputs\.candidate_sha \}\}/);
  assert.match(workflow,/MERGE_SHA: \$\{\{ steps\.target\.outputs\.merge_sha \}\}/);
  assert.match(workflow,/controller_pr_number/);
  assert.match(workflow,/terminalization_mode/);
  assert.match(workflow,/obligation-terminal-evidence-\$\{\{ steps\.target\.outputs\.pr_number \}\}/);
});

test('terminalizer replay remains opt-in and preserves normal merged-PR behavior by default', async()=>{
  const workflow=await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(workflow,/pr_number="\$EVENT_PR_NUMBER"/);
  assert.match(workflow,/candidate_sha="\$EVENT_CANDIDATE_SHA"/);
  assert.match(workflow,/merge_sha="\$EVENT_MERGE_SHA"/);
  assert.match(workflow,/mode="current"/);
  assert.match(workflow,/mode="replay"/);
  assert.match(workflow,/TERMINAL_REPLAY_SELF_REFERENCE/);
});
