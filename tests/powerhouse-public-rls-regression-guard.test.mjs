import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
  new URL('../supabase/migrations/20260916053000_powerhouse_public_rls_regression_guard.sql', import.meta.url),
  'utf8'
).catch(() => '');

test('new public tables are forced behind RLS at DDL time', () => {
  assert.match(migration, /create\s+event\s+trigger\s+powerhouse_public_rls_default_deny/i);
  assert.match(migration, /pg_event_trigger_ddl_commands\s*\(\s*\)/i);
  assert.match(migration, /enable\s+row\s+level\s+security/i);
});

test('a scheduled safety net repairs any public-table RLS drift', () => {
  assert.match(migration, /powerhouse_public_rls_guard_scan/i);
  assert.match(migration, /cron\.schedule/i);
  assert.match(migration, /not\s+c\.relrowsecurity/i);
});

test('guard evidence is private and callable only by trusted server roles', () => {
  assert.match(migration, /powerhouse_security_guard_events/i);
  assert.match(migration, /revoke\s+all\s+on\s+public\.powerhouse_security_guard_events\s+from\s+anon,\s*authenticated/i);
  assert.match(migration, /revoke\s+all\s+on\s+function[\s\S]+from\s+public,\s*anon,\s*authenticated/i);
});

test('the prevention migration never disables RLS', () => {
  assert.doesNotMatch(migration, /disable\s+row\s+level\s+security/i);
});
