import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const healthPath = new URL('../supabase/migrations/20260915142423_powerhouse_health_run_identity_clock_timestamp_v1.sql', import.meta.url);
const revenuePath = new URL('../supabase/migrations/20260915142504_powerhouse_revenue_calibration_projection_v1.sql', import.meta.url);
const healthAlias = new URL('../supabase/migrations/20260915162400_powerhouse_health_run_identity_clock_timestamp_v1.sql', import.meta.url);
const revenueAlias = new URL('../supabase/migrations/20260915162500_powerhouse_revenue_calibration_projection_v1.sql', import.meta.url);

const health = fs.readFileSync(healthPath, 'utf8');
const revenue = fs.readFileSync(revenuePath, 'utf8');

test('GitHub mirrors the exact production migration identities without semantic timestamp aliases', () => {
  assert.ok(fs.existsSync(healthPath));
  assert.ok(fs.existsSync(revenuePath));
  assert.equal(fs.existsSync(healthAlias), false, 'semantic timestamp alias must not become a second migration identity');
  assert.equal(fs.existsSync(revenueAlias), false, 'semantic timestamp alias must not become a second migration identity');
});

test('health measurements use wall-clock run identity', () => {
  assert.match(health, /clock_timestamp\(\)/);
  assert.match(health, /BG_GEZONDHEID_RUN_IDENTITY_SIGNATURE_NOT_FOUND/);
});

test('Brain revenue learning reuses the canonical forecast-action-outcome-calibration lineage', () => {
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

test('projection remains fail-closed and settlement calibration is idempotent', () => {
  assert.match(revenue, /POWERHOUSE_REVENUE_PREDICTION_SCHEMA_REQUIRED/);
  assert.match(revenue, /POWERHOUSE_REVENUE_SETTLEMENT_SCHEMA_REQUIRED/);
  assert.match(revenue, /canonical_brain_record_id/);
  assert.match(revenue, /if not exists\(/i);
});
