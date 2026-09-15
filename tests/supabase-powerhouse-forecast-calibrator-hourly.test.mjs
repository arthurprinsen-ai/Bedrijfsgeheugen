import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915140500_powerhouse_forecast_calibrator_hourly_v1.sql', import.meta.url);
const sql = fs.readFileSync(migrationUrl, 'utf8');

test('hourly calibrator reuses the canonical existing cron command', () => {
  assert.match(sql, /where jobname = 'powerhouse-forecast-calibrator-daily'/i);
  assert.match(sql, /powerhouse-forecast-calibrator-hourly-v1/i);
  assert.match(sql, /'20 \* \* \* \*'/);
  assert.doesNotMatch(sql, /ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY|decrypted_secret/i);
});

test('cadence gap is written to the existing learning lineage', () => {
  assert.match(sql, /production_learning_recorded/i);
  assert.match(sql, /learning:forecast-calibrator-cadence-v1/i);
  assert.match(sql, /closed-loop/i);
});
