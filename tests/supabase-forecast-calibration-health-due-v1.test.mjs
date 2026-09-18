import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918101000_forecast_calibration_health_due_v1.sql','utf8');

test('forecast calibration health is driven by overdue obligations',()=>{
  assert.match(sql,/type='FORECAST_CALIBRATION'/);
  assert.match(sql,/status='OPEN'/);
  assert.match(sql,/due_at<=now\(\)/);
  assert.match(sql,/then now\(\)/);
  assert.match(sql,/max\(fc\.measured_at\)/);
});

test('health patch is fail-closed on unexpected function drift',()=>{
  assert.match(sql,/FORECAST_CALIBRATION_HEALTH_SIGNATURE_NOT_FOUND/);
  assert.match(sql,/pg_get_functiondef\('public\.bg_gezondheid_meten\(\)'::regprocedure\)/);
});
