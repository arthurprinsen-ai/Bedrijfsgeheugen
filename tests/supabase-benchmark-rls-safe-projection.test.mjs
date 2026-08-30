import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../supabase/migrations/20260830_benchmark_rls_safe_projection.sql', import.meta.url), 'utf8')).toLowerCase();

for (const view of ['benchmark_branche', 'benchmark_niveaus', 'benchmark_offertes']) {
  test(`${view} is security invoker`, () => {
    assert.match(sql, new RegExp(`create or replace view public\\.${view}[\\s\\S]*?security_invoker = true`));
  });
}

test('raw source tables are never granted select by this migration', () => {
  assert.doesNotMatch(sql, /grant\s+select\s+on\s+(?:table\s+)?public\.scan_inzendingen\b/);
  assert.doesNotMatch(sql, /grant\s+select\s+on\s+(?:table\s+)?public\.offerte_inzendingen\b/);
});

test('projection tables enforce RLS and public read-only access', () => {
  for (const table of ['benchmark_branche_data', 'benchmark_niveaus_data', 'benchmark_offertes_data']) {
    assert.match(sql, new RegExp(`alter table benchmark_projection\\.${table} enable row level security`));
  }
  assert.match(sql, /grant select on table[\s\S]*benchmark_projection\.benchmark_branche_data[\s\S]*to anon, authenticated, service_role/);
});

test('cohort threshold remains at least five', () => {
  const matches = sql.match(/having count\(\*\) >= 5/g) ?? [];
  assert.ok(matches.length >= 6, `expected threshold in initial and refresh queries, got ${matches.length}`);
});

test('refresh triggers are statement-level, not row-level', () => {
  const matches = sql.match(/for each statement execute function benchmark_projection\./g) ?? [];
  assert.equal(matches.length, 2);
  assert.doesNotMatch(sql, /for each row execute function benchmark_projection\./);
});

test('refresh trigger functions are not callable by client roles', () => {
  assert.match(sql, /revoke all on function benchmark_projection\.refresh_scan_benchmarks\(\) from public, anon, authenticated, service_role/);
  assert.match(sql, /revoke all on function benchmark_projection\.refresh_offerte_benchmarks\(\) from public, anon, authenticated, service_role/);
});
