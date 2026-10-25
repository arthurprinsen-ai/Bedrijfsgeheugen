import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/autonomous-branch-sync.yml',import.meta.url),'utf8');

test('branch sync runs on main pushes and serializes reconciliation',()=>{
  assert.match(workflow,/push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow,/group: autonomous-branch-sync/);
  assert.match(workflow,/cancel-in-progress: false/);
});

test('branch sync uses GitHub-native CAS update and never force-pushes',()=>{
  assert.match(workflow,/expected_head_sha: pr\.head\.sha/);
  assert.match(workflow,/pulls\/\{pull_number\}\/update-branch/);
  assert.doesNotMatch(workflow,/git push .*--force/);
});

test('branch sync excludes forks and draft PRs and does not claim API acceptance as verification',()=>{
  assert.match(workflow,/pr\.draft \|\| pr\.head\.repo\?\.full_name/);
  assert.match(workflow,/Accepted is not verified/);
});
