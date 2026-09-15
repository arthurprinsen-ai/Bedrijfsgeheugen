import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const health = readFileSync(new URL('../supabase/migrations/20260915162400_powerhouse_health_run_identity_clock_timestamp_v1.sql', import.meta.url), 'utf8');
const revenue = readFileSync(new URL('../supabase/migrations/20260915162500_powerhouse_revenue_calibration_projection_v1.sql', import.meta.url), 'utf8');

test('health measurements use wall clock run identity inside repeated same-transaction cycles', () => {
  assert.match(health, /clock_timestamp\(\)/);
  assert.match(health, /BG_GEZONDHEID_RUN_IDENTITY_SIGNATURE_NOT_FOUND/);
});

test('Brain revenue learning projects into the existing canonical Powerhouse lineage', () => {
  for (const required of [
    'powerhouse_forecasts',
    'powerhouse_sales_actions',
    'powerhouse_sales_outcomes',
    'powerhouse_forecast_calibration',
    'trg_powerhouse_project_brain_revenue_learning',
    'POWERHOUSE_ORIGINATING_FORECAST_REQUIRED'
  ]) assert.ok(revenue.includes(required), `missing ${required}`);
  assert.doesNotMatch(revenue, /create\s+table/i);
  assert.doesNotMatch(revenue, /make\b/i);
});

test('projection is fail-closed and calibration writeback is idempotent per Brain settlement', () => {
  assert.match(revenue, /POWERHOUSE_REVENUE_PREDICTION_SCHEMA_REQUIRED/);
  assert.match(revenue, /POWERHOUSE_REVENUE_SETTLEMENT_SCHEMA_REQUIRED/);
  assert.match(revenue, /canonical_brain_record_id/);
  assert.match(revenue, /if not exists\(/i);
});