import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migrationPath='supabase/migrations/20260915090000_powerhouse_revenue_calibration_closure.sql';
const sql=await readFile(migrationPath,'utf8').catch(()=> '');

test('canonical Brain revenue learning projects into existing Powerhouse tables only',()=>{
  assert.ok(sql,'revenue calibration closure migration must exist');
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

test('no-Make production architecture is part of the same Powerhouse guardrail',()=>{
  assert.match(sql,/powerhouse-no-make-production-v1/i);
  assert.match(sql,/channel-identity-hard-gate-v2/i);
  assert.match(sql,/growth-revenue-os-1m-2027-v1/i);
  assert.doesNotMatch(sql,/BG169_HANDOFF_URL|transport="make"|make_accepted/i);
});
