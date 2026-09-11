import test from 'node:test';
import assert from 'node:assert/strict';
import {learnFromCompanyDecision} from './company-decision-learning.mjs';

test('reuses canonical calibration and lowers confidence signal after material overprediction',()=>{
  const learning=learnFromCompanyDecision({
    decisionId:'d1',decision:'TEST',expectedValue:100000,expectedCost:20000,confidence:.8
  },{
    actualValue:40000,actualCost:25000,causalConfidence:'HIGH',verified:true,evidenceIds:['e-outcome']
  });
  assert.equal(learning.calibration.direction,'OVERPREDICT');
  assert.equal(learning.calibration.value_error,60000);
  assert.ok(learning.confidenceDelta<0);
  assert.ok(learning.nextConfidence<.8);
  assert.equal(learning.reprioritize,true);
  assert.equal(learning.learningRecord.type,'Learning');
  assert.equal(learning.learningRecord.decisionId,'d1');
});

test('verified useful outcome can raise confidence but never above one',()=>{
  const learning=learnFromCompanyDecision({
    decisionId:'d2',decision:'TEST',expectedValue:50000,expectedCost:10000,confidence:.95
  },{
    actualValue:65000,actualCost:9000,causalConfidence:'HIGH',verified:true,evidenceIds:['e-good']
  });
  assert.equal(learning.calibration.direction,'UNDERPREDICT');
  assert.ok(learning.confidenceDelta>0);
  assert.ok(learning.nextConfidence<=1);
  assert.equal(learning.reprioritize,true);
});

test('unverified outcome is learning evidence but cannot change confidence automatically',()=>{
  const learning=learnFromCompanyDecision({decisionId:'d3',decision:'TEST',expectedValue:50000,expectedCost:10000,confidence:.7},{actualValue:90000,actualCost:9000,causalConfidence:'HIGH',verified:false,evidenceIds:['e-unverified']});
  assert.equal(learning.confidenceDelta,0);
  assert.equal(learning.nextConfidence,.7);
  assert.equal(learning.reprioritize,false);
  assert.equal(learning.learningRecord.status,'HYPOTHESIS');
});
