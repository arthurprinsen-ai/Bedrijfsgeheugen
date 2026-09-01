import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260901_runtime_slo_from_real_metrics.sql', import.meta.url);

test('runtime SLO projection is derived only after real metric inserts', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /after insert on public\.brain_runtime_metrics/i);
  assert.match(sql, /from public\.brain_runtime_metrics/i);
  assert.match(sql, /percentile_cont\(0\.95\)/i);
  assert.match(sql, /least\(v_cached_samples, v_interactive_samples\)/i);
  assert.doesNotMatch(sql, /insert into public\.brain_runtime_metrics/i, 'migration must never seed synthetic RUM');
});

test('runtime SLO projection is idempotent and least-privilege', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /unique index if not exists brain_runtime_slo_identity_uq/i);
  assert.match(sql, /on conflict \(tenant_id, surface, route\) do update/i);
  assert.match(sql, /revoke all on function public\.refresh_brain_runtime_slo_for_metric\(\) from public/i);
  assert.match(sql, /revoke all on function public\.refresh_brain_runtime_slo_for_metric\(\) from authenticated/i);
});
