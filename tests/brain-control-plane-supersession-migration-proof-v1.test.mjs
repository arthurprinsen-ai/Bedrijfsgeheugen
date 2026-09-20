import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal migration proof traverses supersession lineage', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/across supersession lineage/);
  assert.match(workflow,/SUPERSEDES_LINEAGE_CYCLE/);
  assert.match(workflow,/SUPERSEDES_OBLIGATION_MISMATCH/);
  assert.match(workflow,/SUPERSEDES_PR_NOT_TERMINAL/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_SAFE_TO_SKIP/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_MIGRATION_NOT_CANONICALIZED/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_MIGRATION_AMBIGUOUS/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_MIGRATION_CANONICALIZED/);
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


test('terminal migration proof excludes superseded aliases absent from the canonical merge tree', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/existsSync/);
  assert.match(workflow,/supabase\/migrations\/\$\{item\.version\}_\$\{item\.name\}\.sql/);
});


test('terminal migration proof reconciles historical migration timestamp to current canonical main identity', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/execFileSync\('git',\['fetch','origin','main','--no-tags'\]/);
  assert.match(workflow,/execFileSync\(\s*'git',\s*\['ls-tree','-r','--name-only','origin\/main'/);
  assert.match(workflow,/SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS/);
  assert.match(workflow,/historical_version:item\.version/);
  assert.match(workflow,/match\[2\]===item\.name/);
});
