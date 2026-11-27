import {test} from 'node:test';import assert from 'node:assert/strict';import {recoveryBudget} from '../tools/delivery/adaptive-recovery-capacity.mjs';
test('bounded capacity',()=>{for(let n=0;n<30;n++){const b=recoveryBudget({activeRuns:n});assert.ok(b>=0&&b<=5);if(b>0)assert.ok(n+3*b<=10);}});
test('pressure falls closed',()=>{assert.equal(recoveryBudget({activeRuns:12}),0);assert.equal(recoveryBudget({activeRuns:null}),0);assert.equal(recoveryBudget({activeRuns:-1}),0);});
test('idle budget and reserved capacity',()=>{assert.equal(recoveryBudget({activeRuns:0}),3);assert.equal(recoveryBudget({activeRuns:7}),1);assert.equal(recoveryBudget({activeRuns:8}),0);});
