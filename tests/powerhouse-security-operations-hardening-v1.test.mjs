import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260916174000_powerhouse_security_operations_hardening_v1.sql', import.meta.url),
  'utf8',
);

test('RLS classifier distinguishes intentional deny-all from policy-required', () => {
  assert.match(migration, /INTENTIONAL_DENY_ALL_CLIENTS/);
  assert.match(migration, /POLICY_REQUIRED/);
  assert.match(migration, /POLICY_PRESENT/);
  assert.match(migration, /RLS_DISABLED/);
  assert.match(migration, /has_table_privilege\('anon'/);
  assert.match(migration, /has_table_privilege\('authenticated'/);
});

test('RLS audit remains fail-closed and service-role only', () => {
  assert.match(migration, /security_invoker\s*=\s*true/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = pg_catalog/i);
  assert.match(migration, /revoke all on public\.powerhouse_public_rls_policy_classification_v1 from public, anon, authenticated/i);
  assert.match(migration, /grant select on public\.powerhouse_public_rls_policy_classification_v1 to service_role/i);
  assert.match(migration, /revoke all on function public\.powerhouse_public_rls_policy_audit_v1\(\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.powerhouse_public_rls_policy_audit_v1\(\) to service_role/i);
});

test('hardening migration never mass-creates policies or drops indexes', () => {
  assert.doesNotMatch(migration, /create\s+policy/i);
  assert.doesNotMatch(migration, /drop\s+index/i);
});
