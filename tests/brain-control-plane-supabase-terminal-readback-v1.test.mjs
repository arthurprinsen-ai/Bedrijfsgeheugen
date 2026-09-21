import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import fs from 'node:fs';

test('terminal closure derives exact Supabase migration identities across the same-obligation supersession lineage', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/Derive exact Supabase production migration identities across supersession lineage/);
  assert.ok(workflow.includes("/^supabase\\/migrations\\/[^/]+\\.sql$/"));
  assert.match(workflow,/migration_readback_required/);
  assert.match(workflow,/expected_migrations/);
  assert.match(workflow,/SUPERSEDES_OBLIGATION_BOUNDARY/);
  assert.match(workflow,/source_pr:prNumber/);
});

test('terminal claim is fail-closed when required migration ledger readback is not verified', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/MIGRATION_READBACK_REQUIRED/);
  assert.match(workflow,/\.migration_readback_verified == true/);
  const durable=workflow.indexOf('Persist canonical Brain terminal evidence before terminal claim');
  const claim=workflow.indexOf('Persist terminal evidence and release writer lease');
  assert.ok(durable>0 && claim>durable);
});

test('Supabase edge authority verifies exact production ledger identities before fulfillment', async()=>{
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(edge,/powerhouse_supabase_migration_readback_v1/);
  assert.match(edge,/MIGRATION_LEDGER_IDENTITY_MISMATCH/);
  assert.match(edge,/migration_readback_verified/);
  assert.ok(edge.indexOf('powerhouse_supabase_migration_readback_v1') < edge.indexOf("p_state:'FULFILLED'"));
});

test('recovery supervisor migration uses exact production-ledger identity', ()=>{
  const dir=new URL('../supabase/migrations/',import.meta.url);
  assert.equal(fs.existsSync(new URL('20260918143600_powerhouse_control_plane_recovery_supervisor_v1.sql',dir)),true);
  assert.equal(fs.existsSync(new URL('20260918143000_powerhouse_control_plane_recovery_supervisor_v1.sql',dir)),false);
});

test('canonical multi-migration ledger verifier is represented by exact production identity', ()=>{
  const dir=new URL('../supabase/migrations/',import.meta.url);
  assert.equal(fs.existsSync(new URL('20260918143758_powerhouse_supabase_migration_readback_v1.sql',dir)),true);
  assert.equal(fs.existsSync(new URL('20260918143915_powerhouse_terminal_migration_identity_readback_v1.sql',dir)),true);
});


test('unmerged migration-bearing recovery remains fail-closed and separate from merged migration authority', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS/);
  const learning=JSON.parse(await readFile('brain/learning/2026-09-18-unmerged-supabase-supersedes-terminal-lineage-v1.json','utf8'));
  assert.equal(learning.prevention_rule.includes('merged production-authority ancestry'),true);
  assert.equal(learning.canonical_metadata_pattern.direct_supersedes,'last merged predecessor in the same obligation lineage');
  assert.equal(learning.canonical_metadata_pattern.terminal_behavior.includes('fail closed'),true);
});
