import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unmergedMigrationFullyReplaced} from '../tools/delivery/terminal-migration-identity.mjs';
const current='supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql';
const unrelated='supabase/migrations/20261022173501_unrelated_customer_security_v1.sql';
test('retired migration is covered ONLY by exact terminal merged path',()=>{
  assert.equal(unmergedMigrationFullyReplaced([current],[current]),true);
  assert.equal(unmergedMigrationFullyReplaced([current],[unrelated]),false);
  assert.equal(unmergedMigrationFullyReplaced([current],[]),false);
  assert.equal(unmergedMigrationFullyReplaced([current],[current.replace('20261022173500','20261022173502')]),false);
  assert.equal(unmergedMigrationFullyReplaced([current,unrelated],[current]),false);
});
test('invalid or unknown migration identities fail closed; empty retired history is safe',()=>{
  assert.equal(unmergedMigrationFullyReplaced([],[]),true);
  assert.equal(unmergedMigrationFullyReplaced(['supabase/functions/edge/index.ts'],[current]),false);
  assert.equal(unmergedMigrationFullyReplaced(['supabase/migrations/not_timestamp.sql'],[current]),false);
  assert.equal(unmergedMigrationFullyReplaced([current],'not-an-array'),false);
  assert.equal(unmergedMigrationFullyReplaced(null,[current]),false);
});
test('terminal workflow requires merged-terminal path and current source presence before skipping retired migrations',()=>{
  const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/unmergedMigrationFullyReplaced\(migrationFiles,terminalPaths\)/);
  assert.match(workflow,/prNumber===requestedPrNumber\) terminalMergedMigrationPaths\.add\(candidate\)/);
  assert.match(workflow,/\.filter\(path=>existsSync\(path\)\)/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS/);
  assert.match(workflow,/const canonical=resolveTerminalMigrationIdentities\(unique,currentMigrationPaths\)/);
  // The provider marker is canonical contract data, not a literal in the runner.
  const policy=JSON.parse(readFileSync('brain/contracts/production-readback-v1.json','utf8'));
  assert.equal(policy.productionTruth.supabaseMigrationReadback.marker,'Terminal-Supabase-Migration-Readback');
  assert.equal(policy.productionTruth.supabaseMigrationReadback.failClosedWhenMissing,true);
  assert.match(workflow,/migration_readback_required/);
  assert.match(workflow,/expected_migrations/);
  const terminalizer=readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(terminalizer,/SUPABASE_MIGRATION_PROVIDER_READBACK_INCOMPLETE/);
  assert.match(terminalizer,/TERMINAL_SUPABASE_MIGRATION_READBACK_EVIDENCE_MISSING/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_REPLACED_BY_MERGED_TERMINAL_MIGRATION/);
});
