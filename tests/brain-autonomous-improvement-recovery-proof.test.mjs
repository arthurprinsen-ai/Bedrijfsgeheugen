import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
  'supabase/migrations/20260916154700_autonomous_improvement_recovery_proof_hardening_v1.sql',
  'utf8'
);

test('safe chaos requires fault retry readback and idempotency proof', () => {
  assert.match(migration, /for v_attempt in 1\.\.2 loop/i);
  assert.match(migration, /v_fault_injected := true/i);
  assert.match(migration, /v_recovered := true/i);
  assert.match(migration, /on conflict \(scenario\) do update/i);
  assert.match(migration, /partial_writeback_rolled_back/i);
  assert.match(migration, /v_state_rows = 1/i);
  assert.match(migration, /v_attempts = 2/i);
  assert.doesNotMatch(
    migration,
    /'recovered'\s*,\s*true\s*,\s*'idempotent'\s*,\s*true\s*,\s*'consistent'\s*,\s*true/i
  );
});

test('chaos probe remains isolated and service-role only', () => {
  assert.match(migration, /create temporary table if not exists powerhouse_ai_chaos_probe/i);
  assert.match(migration, /on commit drop/i);
  assert.match(migration, /'production_mutation'\s*,\s*false/i);
  assert.match(migration, /revoke execute on function public\.powerhouse_autonomous_improvement_inject_fault_v1\(text\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.powerhouse_autonomous_improvement_inject_fault_v1\(text\) to service_role/i);
});
