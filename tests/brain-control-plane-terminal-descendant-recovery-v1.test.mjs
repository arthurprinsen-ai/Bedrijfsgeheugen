import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('central terminal closure owns descendant-safe recovery', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/PRODUCTION_DESCENDANT_READBACK_PROVEN/);
  assert.match(workflow,/descendant_live/);
  assert.match(workflow,/git merge-base --is-ancestor/);
  assert.match(workflow,/Terminal-Production-Readback:/);
});

test('real canonical readback failures do not downgrade into descendant recovery', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/if \[ "\$source_conclusion" != "cancelled" \]/);
  assert.match(workflow,/PRODUCTION_READBACK_FAILED/);
});

test('Edge terminal authority requires explicit verified descendant proof', async()=>{
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(edge,/\['canonical_run','descendant_live','github_main'\]/);
  assert.match(edge,/PRODUCTION_DEPLOY_ID_MISSING/);
  assert.match(edge,/GITHUB_MAIN_READBACK_SHA_MISMATCH/);
  assert.match(edge,/GITHUB_MAIN_READBACK_RUN_MUST_BE_NULL/);
  assert.match(edge,/GITHUB_MAIN_DEPLOY_ID_MUST_BE_NULL/);
  assert.match(edge,/GITHUB_MAIN_READBACK_NOT_VERIFIED/);
  assert.match(edge,/PRODUCTION_DESCENDANT_READBACK_NOT_VERIFIED/);
  assert.match(edge,/production_observed_sha/);
});


test('canonical terminal closure is resumable by merged PR number', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/pr_number:/);
  assert.match(workflow,/Resolve canonical merged PR context/);
  assert.match(workflow,/TERMINAL_PR_NOT_MERGED/);
  assert.match(workflow,/steps\.context\.outputs\.merge_sha/);
  assert.match(workflow,/steps\.context\.outputs\.candidate_sha/);
  assert.match(workflow,/Obligation Terminal Closure PR #/);
});

test('terminal recovery keeps one concurrency lineage per PR across close and dispatch events', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/group: obligation-terminal-closure-\$\{\{ github\.event\.pull_request\.number \|\| inputs\.pr_number \}\}/);
  assert.match(workflow,/cancel-in-progress: false/);
});
