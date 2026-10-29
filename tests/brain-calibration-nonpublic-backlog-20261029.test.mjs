import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync('supabase/functions/powerhouse-forecast-calibrator/index.ts','utf8');

test('empty public queue is not globally empty',()=>{
  assert.equal(code.includes('NO_DUE_CALIBRATIONS'),false);
  assert.equal(code.includes('NON_PUBLIC_SCOPE_BACKLOG'),true);
  assert.equal(code.includes('PUBLIC_SCOPE_IDLE'),true);
  assert.equal(code.includes('CALIBRATION_BACKLOG_COUNT_READ_FAILED'),true);
});

test('bounded read-only backlog count does not send private payloads to public AI',()=>{
  const part=code.slice(code.indexOf('if(!due?.length){'),code.indexOf('const apiKey='));
  assert.equal(part.includes(".select('obligation_id',{count:'exact',head:true})"),true);
  assert.equal(part.includes(".eq('type','FORECAST_CALIBRATION')"),true);
  assert.equal(part.includes(".eq('status','OPEN')"),true);
  assert.equal(part.includes(".lte('due_at'"),true);
  assert.equal(part.includes('requestForecastPlan('),false);
  assert.equal(part.includes(".select('*')"),false);
});

test('health retains honest incomplete status without changing public scope authority',()=>{
  assert.equal(code.includes("db.rpc('powerhouse_public_market_calibration_due_v1'"),true);
  assert.equal(code.includes('out_of_public_scope_due:outOfPublicScopeDue'),true);
  assert.equal(code.includes('truth_boundary'),true);
});
