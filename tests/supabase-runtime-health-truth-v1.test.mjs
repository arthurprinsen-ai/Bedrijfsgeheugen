import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/20260918094000_runtime_health_truth_v1.sql','utf8');

test('edge-function health migrates legacy freshness to current 30-minute evidence without leaving it active',()=>{
  assert.match(sql,/v_old constant text := 'where a\.aangeroepen_op>now\(\)-interval ''26 hours'' order by a\.functie,a\.aangeroepen_op desc';/);
  assert.match(sql,/v_new constant text := 'where a\.aangeroepen_op>now\(\)-interval ''30 minutes'' order by a\.functie,a\.aangeroepen_op desc';/);
  assert.match(sql,/execute replace\(v_def,v_old,v_new\)/);
  assert.equal((sql.match(/a\.aangeroepen_op>now\(\)-interval ''26 hours''/g) || []).length,1);
  assert.equal((sql.match(/a\.aangeroepen_op>now\(\)-interval ''30 minutes''/g) || []).length,1);
});

test('historical daily proof errors do not count as current structural runtime errors',()=>{
  assert.match(sql,/event_type='full_cycle_production_proof'/);
  assert.match(sql,/Europe\/Amsterdam/);
  assert.match(sql,/subject_key <>/);
});

test('forecast calibration freshness is fail-closed only when calibration is actually due',()=>{
  assert.match(sql,/subject_key='forecast-calibration'/);
  assert.match(sql,/type='FORECAST_CALIBRATION'/);
  assert.match(sql,/status='OPEN'/);
  assert.match(sql,/due_at<=now\(\)/);
});

test('health fix preserves source evidence instead of deleting history',()=>{
  assert.doesNotMatch(sql,/delete from public\.powerhouse_runtime_events/i);
  assert.doesNotMatch(sql,/delete from public\.bg_gezondheid/i);
});
