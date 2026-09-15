import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20260914152000_predictive_first_mover_intelligence_v1.sql',import.meta.url),'utf8');
const engine=readFileSync(new URL('../supabase/functions/powerhouse-predictive-engine/index.ts',import.meta.url),'utf8');
const calibrator=readFileSync(new URL('../supabase/functions/powerhouse-forecast-calibrator/index.ts',import.meta.url),'utf8');

const requiredObjects=[
  'powerhouse_predictive_signals',
  'powerhouse_forecasts',
  'powerhouse_first_mover_claims',
  'powerhouse_forecast_calibration',
  'powerhouse_first_mover_queue',
  'powerhouse_forecasts_due_calibration',
  'powerhouse_predictive_health'
];

test('migration owns the complete canonical predictive v1 contract',()=>{
  for(const object of requiredObjects)assert.match(migration,new RegExp(`public\\.${object}\\b`),`missing ${object}`);
  assert.match(migration,/predictive-first-mover-intelligence-v1/);
  assert.match(migration,/lifecycle in \('candidate','active','materialized','missed','expired','rejected'\)/);
  assert.match(migration,/prediction_mode in \('reactive','anticipatory','category_creation'\)/);
});

test('active forecasts fail closed without sufficient confidence and evidence',()=>{
  assert.match(migration,/lifecycle <> 'active' or \(confidence >= 0\.55 and probability >= 0\.5 and jsonb_array_length\(evidence_refs\) >= 2\)/);
  assert.match(migration,/jsonb_array_length\(f\.evidence_refs\) >= 2/);
});

test('first mover scoring penalizes market saturation',()=>{
  const score=(saturation)=>0.8*0.8*0.75*0.8*0.8*0.8*(1-saturation)*0.75*100;
  assert.ok(score(.2)>score(.8));
  assert.match(migration,/\(1 - greatest\(0, least\(1, coalesce\(p_market_saturation,1\)\)\)\)/);
});

test('predictive engine is evidence-bound and does not publish',()=>{
  assert.match(engine,/independent\.size>=2&&quality>=\.55/);
  assert.match(engine,/evidenceRefs\.length<2/);
  assert.match(engine,/prediction_mode:'anticipatory'/);
  assert.match(engine,/recommendation_type:'predictive_first_mover'/);
  assert.doesNotMatch(engine,/buffer|shareNow|publish(ed|ing)?\s*\(/i);
});

test('predictive recommendation preserves forecast provenance and truth framing',()=>{
  for(const field of ['forecast_id','claim_id','prediction_mode','prediction_rationale','evidence_refs'])assert.match(engine,new RegExp(field));
  assert.match(engine,/Forecast, not fact\./);
});

test('calibrator implements the Brier requirement exactly',()=>{
  const brier=(p,o)=>Math.round(Math.pow(p-o,2)*1_000_000)/1_000_000;
  assert.equal(brier(.8,1),.04);
  assert.equal(brier(.8,0),.64);
  assert.match(calibrator,/Math\.pow\(probability-outcome,2\)/);
});

test('health stays degraded without execution/calibration evidence',()=>{
  assert.match(migration,/missing_predictive_execution_evidence/);
  assert.match(migration,/overdue_calibration_without_execution_evidence/);
  assert.match(migration,/then 'degraded'/);
});
