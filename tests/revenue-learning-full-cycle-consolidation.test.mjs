import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(p)=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const migration=read('supabase/migrations/20260915165000_powerhouse_full_cycle_consolidation_v1.sql');
const proof=read('supabase/migrations/20260915140200_powerhouse_full_cycle_status_normalization_v1.sql');

const requiredLineage=[
  'powerhouse_forecasts',
  'powerhouse_sales_actions',
  'powerhouse_sales_outcomes',
  'powerhouse_forecast_calibration',
  'powerhouse_runtime_events'
];

test('full-cycle proof is fail-closed on source, provider, execution and predictive health',()=>{
  assert.ok(proof,'canonical full-cycle proof migration must remain source controlled');
  for(const token of ['required_sources_healthy','buffer_healthy','ga4_healthy','gmail_healthy','execution_healthy','predictive_healthy','overdue_calibrations']) {
    assert.match(proof,new RegExp(token));
  }
  assert.match(proof,/observed_revenue_eur_90d/);
});

test('consolidation removes the duplicate calibrator scheduler and preserves the canonical hourly cadence',()=>{
  assert.ok(migration,'full-cycle consolidation migration must exist');
  assert.match(migration,/powerhouse-forecast-calibrator-hourly-v1/);
  assert.match(migration,/cron\.unschedule/i);
  assert.match(migration,/powerhouse-forecast-calibrator-daily/);
  assert.match(migration,/cron\.alter_job/i);
  assert.match(migration,/50 \* \* \* \*/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\([^;]*powerhouse-forecast-calibrator-hourly-v1/is);
});

test('consolidation records production learning and canonical commercial lineage',()=>{
  assert.ok(migration);
  assert.match(migration,/duplicate calibrator/i);
  assert.match(migration,/NO_PARALLEL_SCHEDULER|no-parallel-scheduler/i);
  assert.match(migration,/powerhouse-full-cycle-proof-v1/i);
  for(const table of requiredLineage) assert.match(migration,new RegExp(table));
  assert.match(migration,/realized revenue/i);
  assert.match(migration,/provider readback/i);
});
