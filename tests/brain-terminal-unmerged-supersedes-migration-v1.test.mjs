import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertRetiredMigrationPathsCovered} from '../tools/delivery/terminal-migration-identity.mjs';

const path='supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql';
const merged=[{version:'20261022173500',name:'brain_failure_observe_semantic_guard_v1',source_pr:4697}];

test('historical #4686 exact SQL path is covered by the released #4697 successor',()=>{
  assert.deepEqual(assertRetiredMigrationPathsCovered(4686,[path],merged),{
    source_pr:4686,covered_paths:[path]});
});
test('unmerged predecessor with extra unshipped SQL must remain fail-closed',()=>{
  assert.throws(()=>assertRetiredMigrationPathsCovered(4686,[
    path,'supabase/migrations/20261022190500_brain_failure_semantic_project_isolation_v2.sql'
  ],merged),/UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS:4686:.*20261022190500/);
});
test('a similarly named but different version is not proof of exact release',()=>{
  assert.throws(()=>assertRetiredMigrationPathsCovered(4686,[
    'supabase/migrations/20261022173600_brain_failure_observe_semantic_guard_v1.sql'
  ],merged),/UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS/);
});
test('closed predecessor without SQL is safe; unmerged only does not authorize new migration',()=>{
  assert.deepEqual(assertRetiredMigrationPathsCovered(4686,[],merged).covered_paths,[]);
  assert.throws(()=>assertRetiredMigrationPathsCovered(4686,[path],[]),
    /UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS/);
});
test('deduplicate identical file references, reject invalid PR IDs',()=>{
  assert.deepEqual(assertRetiredMigrationPathsCovered(4686,[path,path],merged).covered_paths,[path]);
  assert.throws(()=>assertRetiredMigrationPathsCovered(0,[path],merged),/SUPERSEDES_PR_ID_INVALID/);
});
test('the canonical terminal workflow uses the guarded check with no provider bypass',()=>{
  const src=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(src,/assertRetiredMigrationPathsCovered\(prNumber,migrationFiles,expected\)/);
  assert.match(src,/SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN|supabase-migration-production-readback\.mjs/);
  assert.match(src,/Persist canonical Brain terminal evidence before terminal claim/);
});
