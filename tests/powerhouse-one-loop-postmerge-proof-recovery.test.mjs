import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const outcomeWorkflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
const cleanupWorkflow = await readFile('.github/workflows/powerhouse-merged-branch-cleanup.yml', 'utf8');

test('production readback resolves squash candidate from the exact merged PR before merge-parent fallback', () => {
  assert.match(outcomeWorkflow, /pull-requests:\s*read/);
  assert.match(outcomeWorkflow, /commits\/\$\{SOURCE_HEAD_SHA\}\/pulls/);
  assert.match(outcomeWorkflow, /merge_commit_sha/);
  assert.match(outcomeWorkflow, /head\.sha/);
  assert.match(outcomeWorkflow, /candidate_count/);
  assert.match(outcomeWorkflow, /parent_count/);
  assert.match(outcomeWorkflow, /COMPLETION_CANDIDATE_IDENTITY_UNRESOLVED/);
});

test('merged branch cleanup emits a concrete GitHub error annotation before any terminal failure', () => {
  assert.match(cleanupWorkflow, /::error::Powerhouse merged branch cleanup failed/);
  assert.match(cleanupWorkflow, /detail=\$\{detail:-UNKNOWN\}/);
});
