import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260901_runtime_slo_from_real_metrics.sql', import.meta.url);

test('runtime SLO preserves the existing view and derives only from real metrics', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create or replace view public\.brain_runtime_slo/i);
  assert.match(sql, /from public\.brain_runtime_metrics/i);
  assert.match(sql, /percentile_cont\(0\.95\)/i);
  assert.match(sql, /least\([\s\S]*count\(\*\) filter \(where metric_name = 'cached_ms'\)[\s\S]*count\(\*\) filter \(where metric_name = 'interactive_ms'\)[\s\S]*\) as samples/i);
  assert.doesNotMatch(sql, /insert into public\.brain_runtime_metrics/i, 'migration must never seed synthetic RUM');
});

test('runtime SLO migration does not replace the view with trigger/table machinery', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.doesNotMatch(sql, /create trigger/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.doesNotMatch(sql, /unique index/i);
  assert.doesNotMatch(sql, /insert into public\.brain_runtime_slo/i);
});
