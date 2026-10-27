import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync('supabase/migrations/20261027185500_brief_cache_daily_refresh_v1.sql', 'utf8');
test('brief cache is refreshed daily before outreach preparation', () => {
  assert.match(sql, /'50 5 \* \* \*'/);
  assert.match(sql, /powerhouse_refresh_predictive_commercial_brief_cache_v1\(\)/);
});
test('refresh is single-flight and time-bounded', () => {
  assert.match(sql, /pg_try_advisory_xact_lock/);
  assert.match(sql, /statement_timeout','110000'/);
});
