import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915123500_powerhouse_autonomous_growth_revenue_trigger_fix.sql';

test('autonomous calibration refresh never directly calls a trigger function',()=>{
  const sql=readFileSync(migration,'utf8');
  assert.match(sql,/powerhouse_refresh_forecast_calibration_obligations/i);
  assert.match(sql,/revenue_learning_obligations/i);
  assert.match(sql,/returns integer/i);
  assert.match(sql,/regexp_replace/i);
  assert.match(sql,/powerhouse_autonomous_growth_revenue_cycle/i);
  assert.match(sql,/never invoke RETURNS trigger functions/i);
  assert.match(sql,/brain_failure_registry/i);
  assert.doesNotMatch(sql,/perform\s+public\.powerhouse_sync_forecast_calibration_obligation\(\);/i);
});
