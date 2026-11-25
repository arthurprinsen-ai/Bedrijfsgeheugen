import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal migration proof traverses supersession lineage', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/across supersession lineage/);
  assert.match(workflow,/SUPERSEDES_LINEAGE_CYCLE/);
  assert.match(workflow,/SUPERSEDES_OBLIGATION_BOUNDARY/);
  assert.match(workflow,/SUPERSEDES_PR_NOT_TERMINAL/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_SAFE_TO_SKIP/);
  // Unmerged predecessors with migrations are verified by the extracted fail-closed module.
  const identity=await readFile('tools/delivery/terminal-migration-identity.mjs','utf8');
  assert.match(workflow,/verifyRetiredMigrationSupersession\(\{/);
  assert.match(identity,/UNMERGED_SUPERSEDES_MIGRATION_NOT_ADOPTED/);
  assert.match(identity,/SUPERSEDES_MIGRATION_SOURCE_DRIFT/);
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
  assert.match(workflow,/resolveTerminalMigrationIdentities\(unique,currentMigrationPaths\)/);
  // Identity resolution lives in the shared module (unique same-name mapping, ambiguity fails closed).
  const identity=await readFile('tools/delivery/terminal-migration-identity.mjs','utf8');
  assert.match(identity,/SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS/);
  assert.match(identity,/historical_version:version/);
  assert.match(identity,/match\[2\]/);
});
