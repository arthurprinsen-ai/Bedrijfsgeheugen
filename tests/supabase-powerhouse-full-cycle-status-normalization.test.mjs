import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915140200_powerhouse_full_cycle_status_normalization_v1.sql', import.meta.url);
const sql = fs.readFileSync(migrationUrl, 'utf8');

test('full-cycle proof normalizes source health and freshness enums', () => {
  assert.match(sql, /lower\(canonical_health_status\) = 'ok'/i);
  assert.match(sql, /lower\(freshness_status\) = 'fresh'/i);
});

test('full-cycle proof accepts canonical imported GA4 evidence without synthetic fallback', () => {
  assert.match(sql, /lower\(coalesce\(status,''\)\) in \('ok','complete','completed','partial','imported'\)/i);
  assert.match(sql, /v_ga4_batch_rows > 0/i);
  assert.doesNotMatch(sql, /synthetic/i);
});

test('existing calibrator schedule is hardened without parallel scheduler family', () => {
  assert.match(sql, /powerhouse-forecast-calibrator-daily/i);
  assert.match(sql, /'50 \* \* \* \*'/);
  assert.doesNotMatch(sql, /powerhouse-forecast-calibrator-hourly/i);
});

test('normalization remains fail closed and service-role only', () => {
  assert.match(sql, /and v_predictive_healthy/i);
  assert.match(sql, /and v_overdue_calibrations = 0/i);
  assert.match(sql, /revoke execute on function public\.powerhouse_full_cycle_production_proof\(date\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.powerhouse_full_cycle_production_proof\(date\) to service_role/i);
});

test('production incidents are written to canonical learning lineage', () => {
  assert.match(sql, /production_learning_recorded/i);
  assert.match(sql, /enum\/casing mismatch caused false-red full-cycle proof/i);
  assert.match(sql, /forecast calibrator timing gap/i);
  assert.match(sql, /learning:full-cycle-status-normalization-v1/i);
});
