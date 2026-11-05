import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261105190000_powerhouse_expire_stale_forecasts_v1.sql', import.meta.url), 'utf8');

test('expiry only touches active or claimed forecasts whose own horizon is before today', () => {
  assert.match(sql, /where status in \('active', 'claimed'\)/);
  assert.match(sql, /coalesce\(expected_by, horizon_end\) < p_today/);
  assert.match(sql, /coalesce\(expected_by, horizon_end\) is not null/);
  assert.equal((sql.match(/update public\./g) || []).length, 1, 'exactly one write');
  assert.doesNotMatch(sql, /delete\s+from/i);
});

test('function is locked down and runs under the Amsterdam business date', () => {
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = public, pg_temp/);
  assert.match(sql, /revoke all on function public\.powerhouse_expire_stale_forecasts_v1\(date\) from public, anon, authenticated/);
  assert.match(sql, /now\(\) at time zone 'Europe\/Amsterdam'/);
});

test('one idempotent hourly job, scheduled before the nightly generation', () => {
  assert.equal((sql.match(/cron\.schedule\(/g) || []).length, 1);
  assert.match(sql, /cron\.unschedule\('powerhouse-forecast-expiry-v1'\)/);
  assert.match(sql, /'5 \* \* \* \*'/);
});
