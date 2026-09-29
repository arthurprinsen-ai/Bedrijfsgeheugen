import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDeliveryPlan} from '../tools/brain-delivery-system.mjs';

const migration=fs.readFileSync('supabase/migrations/20260929084144_powerhouse_daily_compound_learning_v1.sql','utf8');
const whole=fs.readFileSync('.github/workflows/whole-brain-canonical-loop-v2.yml','utf8');
const universal=fs.readFileSync('.github/workflows/universal-closed-loop-learning.yml','utf8');

test('compound learning reuses canonical outcome and forecast stores',()=>{
  assert.match(migration,/insert into public\.powerhouse_sales_outcomes/i);
  assert.match(migration,/insert into public\.powerhouse_forecast_calibration/i);
  assert.doesNotMatch(migration,/create table/i);
  assert.match(migration,/verified observed events only/i);
});

test('forecast resolution never invents negative outcomes from silence',()=>{
  assert.match(migration,/positive verified outcomes only/i);
  assert.match(migration,/absence is never auto-classified as failure/i);
  assert.match(migration,/auto_negative_resolution',false/i);
});

test('whole-brain and universal learning have a daily schedule',()=>{
  assert.match(whole,/schedule:\s*\n\s*- cron:/);
  assert.match(universal,/schedule:\s*\n\s*- cron:/);
});

test('compound learning is scheduled before self improvement',()=>{
  assert.match(migration,/powerhouse-daily-compound-learning-v1/);
  assert.match(migration,/'50 2 \* \* \*'/);
});

test('compound learning regression is classified as backend delivery work',()=>{
  const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const plan=createDeliveryPlan({
    changedPaths:['tests/powerhouse-daily-compound-learning-v1.test.mjs'],
    headSha:'decafbad12345678',
    policy
  });
  assert.deepEqual(plan.lanes.map(lane=>lane.id),['backend']);
});
