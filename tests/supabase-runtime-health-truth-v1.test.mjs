import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/20260918094000_runtime_health_truth_v1.sql','utf8');

test('edge-function health only treats recent invocation evidence as current',()=>{
  assert.match(sql,/v_old constant text := 'where a\.aangeroepen_op>now\(\)-interval ''26 hours''/);
  assert.match(sql,/v_new constant text := 'where a\.aangeroepen_op>now\(\)-interval ''30 minutes''/);
  assert.match(sql,/elsif position\(v_old in v_def\) > 0 then\s+execute replace\(v_def,v_old,v_new\)/s);
  const activeSql = sql.replace(/v_old constant text :=[^;]+;/,'');
  assert.doesNotMatch(activeSql,/a\.aangeroepen_op>now\(\)-interval ''26 hours''/);
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
