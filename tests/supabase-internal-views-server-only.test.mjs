import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/migrations/20260830_internal_views_server_only.sql', import.meta.url), 'utf8');

for (const view of ['prijsadvies', 'hergebruik_rendement']) {
  test(`${view} uses invoker security and server-only access`, () => {
    assert.match(sql, new RegExp(`alter\\s+view\\s+public\\.${view}\\s+set\\s*\\(security_invoker\\s*=\\s*true\\)`, 'i'));
    assert.match(sql, new RegExp(`public\\.${view}`));
  });
}

test('client roles lose access while service_role retains SELECT only', () => {
  assert.match(sql, /revoke\s+all[\s\S]*from\s+anon\s*,\s*authenticated\s*,\s*service_role/i);
  assert.match(sql, /grant\s+select[\s\S]*to\s+service_role/i);
  assert.doesNotMatch(sql, /grant[^;]*(anon|authenticated)/i);
  assert.doesNotMatch(sql, /grant[^;]*(insert|update|delete|truncate|trigger|references)/i);
});
