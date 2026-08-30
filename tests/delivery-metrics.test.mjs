import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeDeliveryMetrics } from '../platform/delivery/metrics.mjs';

test('healthy independent releases have zero unrelated waiting and drift rebuilds',()=>{
  const summary=summarizeDeliveryMetrics([
    {changeId:'a',startedAt:1000,liveAt:5000,unrelatedWaitMs:0,branchRebuildsForUnrelatedDrift:0,serialWrites:0,duplicateWork:0,ciDurationMs:2000,rollbackDurationMs:0,platformCost:1,unaffectedGatesSkipped:3},
    {changeId:'b',startedAt:2000,liveAt:6000,unrelatedWaitMs:0,branchRebuildsForUnrelatedDrift:0,serialWrites:0,duplicateWork:0,ciDurationMs:1800,rollbackDurationMs:0,platformCost:2,unaffectedGatesSkipped:2}
  ]);
  assert.equal(summary.changeCount,2);
  assert.equal(summary.unrelatedWaitMs,0);
  assert.equal(summary.branchRebuildsForUnrelatedDrift,0);
  assert.equal(summary.timeToLiveMs,8000);
  assert.equal(summary.platformCost,3);
  assert.equal(summary.unaffectedGatesSkipped,5);
});

test('metrics preserve evidence of regressions instead of averaging them away',()=>{
  const summary=summarizeDeliveryMetrics([{startedAt:0,liveAt:1000,unrelatedWaitMs:500,branchRebuildsForUnrelatedDrift:1,serialWrites:4,duplicateWork:1,ciDurationMs:700,rollbackDurationMs:200,platformCost:4,unaffectedGatesSkipped:0}]);
  assert.equal(summary.unrelatedWaitMs,500);
  assert.equal(summary.branchRebuildsForUnrelatedDrift,1);
  assert.equal(summary.serialWrites,4);
  assert.equal(summary.duplicateWork,1);
});
