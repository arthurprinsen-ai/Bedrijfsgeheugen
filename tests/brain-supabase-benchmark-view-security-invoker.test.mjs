import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260830_benchmark_views_security_invoker.sql';

test('benchmark views use security invoker without changing their definitions', async () => {
  assert.equal(existsSync(migrationPath), true, 'security invoker migration must exist');
  const sql = await readFile(migrationPath, 'utf8');
  for (const view of ['benchmark_branche', 'benchmark_niveaus', 'benchmark_offertes']) {
    assert.match(sql, new RegExp(`alter\\s+view\\s+public\\.${view}\\s+set\\s*\\(security_invoker\\s*=\\s*true\\)`, 'i'));
  }
  assert.doesNotMatch(sql, /create\s+(or\s+replace\s+)?view/i);
  assert.doesNotMatch(sql, /drop\s+view/i);
});
