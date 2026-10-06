import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const closurePath = 'supabase/production-baseline/migration-history-terminal-closure-3742-v1.json';

test('3742 terminal closure binds trusted repair to the 568-entry production ledger', async () => {
  const closure = JSON.parse(await readFile(closurePath, 'utf8'));
  const lock = JSON.parse(await readFile('supabase/migration-history.lock.json', 'utf8'));
  assert.equal(closure.contract, 'SUPABASE-MIGRATION-HISTORY-TERMINAL-CLOSURE-v1');
  assert.equal(closure.issue, 3742);
  assert.equal(closure.supported_repair.workflow_run, 37426469433);
  assert.equal(closure.supported_repair.conclusion, 'SUCCESS');
  assert.equal(closure.supported_repair.post_repair_drift, 0);
  assert.equal(lock.applied.length, 568);
  assert.equal(closure.supported_repair.production_ledger_count, 568);

  const byVersion = new Map(lock.applied.map(row => [String(row.version), String(row.name)]));
  for (const row of closure.supported_repair.repaired_versions) {
    assert.equal(byVersion.get(row.version), row.name, 'missing repaired production ledger identity ' + row.version);
  }
});

test('3742 closure is a fresh exact-head candidate and never self-declares terminal green', async () => {
  const closure = JSON.parse(await readFile(closurePath, 'utf8'));
  assert.equal(closure.canonical_recovery.pr, 3766);
  assert.equal(closure.canonical_recovery.merge_sha, 'ccdf134ca4de73e547e54c9de00298d771f87be5');
  assert.equal(closure.canonical_recovery.hosted_supabase_preview, 'SUCCESS');
  assert.equal(closure.acceptance.production_schema_mutation_in_this_candidate, false);
  assert.equal(closure.acceptance.exact_head_delivery, 'REQUIRED_ON_THIS_CANDIDATE');
  assert.equal(closure.acceptance.post_merge_terminalizer, 'REQUIRED_ON_THIS_CANDIDATE');
});

test('current terminalizer recognizes canonical Supabase migration-history closure', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-obligation-terminalizer.yml', 'utf8');
  assert.match(workflow, /Obligation-ID: supabase-migration-history-\\(parity\\|canonical\\)-/);
  assert.match(workflow, /supabase\\/production-baseline\\/\\*/);
  assert.match(workflow, /readback_mode=supabase_history_parity_recovery/);
  assert.equal((workflow.match(/- name: Verify production promotion and runtime readback/g) || []).length, 1);
});
