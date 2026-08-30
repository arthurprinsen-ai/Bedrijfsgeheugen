import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/migrations/20260830_safe_security_hardening.sql', import.meta.url), 'utf8');
const views = ['benchmark_branche','benchmark_niveaus','benchmark_offertes'];

test('stand_bijgewerkt uses a fixed search_path', () => {
  assert.match(sql, /alter\s+function\s+public\.stand_bijgewerkt\(\)\s+set\s+search_path\s*=\s*public\s*,\s*pg_temp/i);
});

test('benchmark views retain read-only access for client and service roles', () => {
  for (const view of views) assert.match(sql, new RegExp(`public\\.${view}`));
  assert.doesNotMatch(sql, /public\.(prijsadvies|hergebruik_rendement)/i);
  assert.match(sql, /revoke\s+all[\s\S]*from\s+anon\s*,\s*authenticated\s*,\s*service_role/i);
  assert.match(sql, /grant\s+select[\s\S]*to\s+anon\s*,\s*authenticated\s*,\s*service_role/i);
  assert.doesNotMatch(sql, /grant[^;]*(insert|update|delete|truncate|trigger|references)/i);
});
