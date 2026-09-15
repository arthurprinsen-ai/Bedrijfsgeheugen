import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fixUrl = new URL('../supabase/migrations/20260915124000_powerhouse_full_cycle_health_status_fix_v1.sql', import.meta.url);
const sql = fs.existsSync(fixUrl) ? fs.readFileSync(fixUrl, 'utf8') : '';

test('full-cycle health status production regression is fixed by a follow-up migration', () => {
  assert.ok(fs.existsSync(fixUrl), 'missing follow-up migration for bg_gezondheid status constraint');
  assert.match(sql, /create or replace function public\.powerhouse_full_cycle_production_proof/i);
  assert.match(sql, /case when v_healthy then 'ok' else 'fout' end/);
  assert.doesNotMatch(sql, /case when v_healthy then 'OK' else 'FOUT' end/);
});

test('fix preserves fail-closed proof and existing canonical writeback', () => {
  assert.match(sql, /v_healthy :=/i);
  assert.match(sql, /powerhouse_runtime_events/i);
  assert.match(sql, /bg_gezondheid/i);
  assert.match(sql, /powerhouse_daily_runs/i);
  assert.match(sql, /gmail-outbound-replies/i);
  assert.match(sql, /bg_buffer_sync/i);
  assert.match(sql, /bg_ga4_sync/i);
});

test('fix keeps service-role-only execution', () => {
  assert.match(sql, /revoke execute on function public\.powerhouse_full_cycle_production_proof\(date\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.powerhouse_full_cycle_production_proof\(date\) to service_role/i);
});