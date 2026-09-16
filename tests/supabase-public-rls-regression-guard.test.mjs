import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const migrationName = '20260916053000_powerhouse_public_rls_regression_guard.sql';
const migration = await readFile(
  new URL(`../supabase/migrations/${migrationName}`, import.meta.url),
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
  assert.match(migration, /revoke\s+all\s+on\s+table\s+public\.powerhouse_security_guard_events\s+from\s+anon,\s*authenticated/i);
  assert.match(migration, /revoke\s+all\s+on\s+function[\s\S]+from\s+public,\s*anon,\s*authenticated/i);
});

test('all migrations after the guard baseline keep RLS fail-closed', async () => {
  const dir = new URL('../supabase/migrations/', import.meta.url);
  const files = (await readdir(dir))
    .filter((name) => name.endsWith('.sql') && name >= migrationName)
    .sort();

  assert.ok(files.includes(migrationName), 'RLS guard baseline migration must exist');
  for (const file of files) {
    const sql = await readFile(new URL(file, dir), 'utf8');
    assert.doesNotMatch(
      sql,
      /\bdisable\s+row\s+level\s+security\b/i,
      `${file} must not disable RLS after the fail-closed baseline`
    );
  }
});
