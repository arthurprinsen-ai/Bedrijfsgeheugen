import test from 'node:test';
import assert from 'node:assert/strict';
import { readMigrationHistory } from './helpers/read-supabase-migration-history.mjs';

const sql=await readMigrationHistory('20260915090000_powerhouse_revenue_calibration_closure.sql');

test('canonical Brain revenue learning projects into existing Powerhouse tables only',()=>{
  assert.match(sql,/AFTER INSERT ON public\.brain_records/i);
  assert.match(sql,/learningType/i);
  assert.match(sql,/revenue_prediction/i);
  assert.match(sql,/revenue_settlement/i);
  for(const table of ['powerhouse_forecasts','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_forecast_calibration']){
    assert.match(sql,new RegExp(`public\\.${table}`,'i'));
  }
  assert.doesNotMatch(sql,/CREATE\s+TABLE/i,'closure must reuse existing Powerhouse persistence');
});

test('projection is idempotent, evidence preserving and decision/prediction linked',()=>{
  assert.match(sql,/ON CONFLICT \(forecast_key\) DO UPDATE/i);
  assert.match(sql,/ON CONFLICT \(dedupe_key\) DO UPDATE/i);
  assert.match(sql,/originatingPredictionId/i);
  assert.match(sql,/evidence_ids/i);
  assert.match(sql,/decision_id/i);
  assert.match(sql,/brier_component/i);
});

test('canonical revenue projection remains provider-neutral and does not introduce a parallel persistence authority',()=>{
  assert.doesNotMatch(sql,/BG169_HANDOFF_URL|transport="make"|make_accepted/i);
  assert.doesNotMatch(sql,/CREATE\s+TABLE/i);
  assert.match(sql,/drop trigger if exists trg_powerhouse_project_brain_revenue_learning/i);
  assert.match(sql,/after insert on public\.brain_records/i);
});
