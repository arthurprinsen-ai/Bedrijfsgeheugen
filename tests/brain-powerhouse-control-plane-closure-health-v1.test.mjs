import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ONE BRAIN health migration recognizes reconciliation worker v2 idempotently', () => {
  const migration=readFileSync('supabase/migrations/20260920090800_powerhouse_one_brain_reconciliation_worker_v2_health_contract_v1.sql','utf8');
  assert.match(migration,/powerhouse-reconciliation-worker-v2/);
  assert.match(migration,/powerhouse-reconciliation-worker-v1/);
  assert.match(migration,/create or replace view public\.powerhouse_one_brain_runtime_health_v1/);
});

test('terminal closure canonicalizes closed-unmerged supersession migration only with one exact canonical identity', () => {
  const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/UNMERGED_SUPERSEDES_MIGRATION_NOT_CANONICALIZED/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_MIGRATION_AMBIGUOUS/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_MIGRATION_CANONICALIZED/);
  assert.match(workflow,/canonicalMatches\.length===1|canonicalMatches\.length>1/);
});
