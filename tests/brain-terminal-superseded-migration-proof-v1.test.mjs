import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unresolvedSupersededMigrationPaths} from '../tools/delivery/terminal-migration-identity.mjs';

const canonical='supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql';
const other='supabase/migrations/20261022190500_brain_failure_semantic_project_isolation_v2.sql';

test('P0 #4681: retired PR 4686 exact SQL path delivered via merged successor #4697 and current main',()=>{
  assert.deepEqual(unresolvedSupersededMigrationPaths([canonical],[canonical],[canonical]),[]);
});
test('closed unmerged predecessor migration is not silently accepted merely because it appears on main',()=>{
  assert.deepEqual(unresolvedSupersededMigrationPaths([canonical],[],[canonical]),[canonical]);
});
test('a merged successor cannot authorize a migration removed from protected main',()=>{
  assert.deepEqual(unresolvedSupersededMigrationPaths([canonical],[canonical],[]),[canonical]);
});
test('any extra unmerged migration remains a hard blocker even alongside the replaced one',()=>{
  assert.deepEqual(unresolvedSupersededMigrationPaths([canonical,other],[canonical],[canonical]),[other]);
});
test('malformed SQL paths and unrelated provider source cannot be covered by lineage',()=>{
  assert.deepEqual(unresolvedSupersededMigrationPaths(['supabase/migrations/../../unsafe.sql','supabase/functions/run/index.ts'],[canonical],[canonical]),['supabase/migrations/../../unsafe.sql','supabase/functions/run/index.ts']);
});
test('alias duplicates stay bounded without creating a new occurrence or requiring a replay',()=>{
  assert.deepEqual(unresolvedSupersededMigrationPaths([canonical,canonical],[canonical],[canonical]),[]);
});
test('terminal workflow preserves obligation boundary and real production readback gates',()=>{
  const yaml=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  const step=yaml.slice(yaml.indexOf('      - name: Derive exact Supabase production migration identities across supersession lineage'));
  assert.match(step,/UNMERGED_SUPERSEDES_REPLACED_BY_MERGED_MAIN/);
  assert.match(step,/UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS/);
  assert.match(step,/metadata\.obligationId!==obligation/);
  assert.match(step,/unresolvedSupersededMigrationPaths\(/);
  assert.match(step,/expected\.map\(item/);
  assert.match(step,/currentMigrationPaths/);
  assert.match(yaml,/SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN|migration_readback_verified/);
  assert.match(yaml,/require_workflow "codeql\.yml" "Powerhouse-CodeQL"/);
  assert.match(yaml,/Persist canonical Brain terminal evidence before terminal claim/);
});
