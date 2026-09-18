import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal migration proof traverses supersession lineage', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/across supersession lineage/);
  assert.match(workflow,/SUPERSEDES_LINEAGE_CYCLE/);
  assert.match(workflow,/SUPERSEDES_OBLIGATION_MISMATCH/);
  assert.match(workflow,/SUPERSEDES_PR_NOT_MERGED/);
  assert.match(workflow,/SUPERSEDES_LINEAGE_DEPTH_EXCEEDED/);
  assert.match(workflow,/metadata\.supersedes===null \? 0 : Number\(metadata\.supersedes\)/);
});

test('migration proof remains obligation-scoped and exact identity based', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/metadata\.obligationId!==obligation/);
  assert.match(workflow,/SUPABASE_MIGRATION_IDENTITY_INVALID/);
  assert.match(workflow,/expected_migrations/);
  assert.match(workflow,/migration_readback_verified/);
});

test('superseded migration proof is deduplicated and source PR is retained in evidence', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/new Map\(expected\.map/);
  assert.match(workflow,/source_pr:prNumber/);
});
