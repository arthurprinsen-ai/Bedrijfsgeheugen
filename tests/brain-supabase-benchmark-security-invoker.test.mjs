import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260830_benchmark_views_security_invoker.sql';

async function migrationText() {
  try {
    return await readFile(migrationPath, 'utf8');
  } catch {
    return '';
  }
}

test('benchmark views execute with caller privileges via security_invoker', async () => {
  const sql = (await migrationText()).toLowerCase();
  assert.notEqual(sql, '', 'security-invoker migration must exist');

  for (const view of ['benchmark_branche', 'benchmark_niveaus', 'benchmark_offertes']) {
    assert.match(
      sql,
      new RegExp(`alter\\s+view\\s+public\\.${view}\\s+set\\s*\\(\\s*security_invoker\\s*=\\s*true\\s*\\)`, 'i'),
      `${view} must use security_invoker=true`,
    );
  }
});

test('hardening is non-semantic and does not recreate benchmark view SQL', async () => {
  const sql = (await migrationText()).toLowerCase();
  assert.doesNotMatch(sql, /create\s+(or\s+replace\s+)?view/);
  assert.doesNotMatch(sql, /drop\s+view/);
});
