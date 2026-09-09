import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';
import { executionThemeMetrics, executionPortfolioMetrics, STANDARD_EXECUTION_STEPS } from '../modules/strategy-execution.js';

const close=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`expected ${actual} ≈ ${expected}`);

test('legacy execution ladder reserves exactly 70 percent of current manual-work cost as realizable value',()=>{
  const theme=PROFILE_DIMENSIONS.find(item=>item.id==='operatie');
  const actual=executionThemeMetrics({theme,employees:24,hourlyCost:52,maturity:2,completed:[false,false,false,false,false]});
  const current=theme.weeklyHours*.78*46*52;
  close(actual.currentAnnualCost,current);
  close(actual.realizableAnnualValue,current*.7);
  close(actual.realizedAnnualValue,0);
});

test('standard five-step ladder preserves the final legacy 10/25/35/20/10 split',()=>{
  assert.deepEqual(STANDARD_EXECUTION_STEPS.map(step=>step.share),[.10,.25,.35,.20,.10]);
  close(STANDARD_EXECUTION_STEPS.reduce((sum,step)=>sum+step.share,0),1);
});

test('completed execution steps release value cumulatively using the legacy shares',()=>{
  const theme=PROFILE_DIMENSIONS.find(item=>item.id==='finance');
  const actual=executionThemeMetrics({theme,employees:24,hourlyCost:52,maturity:2,completed:[true,true,false,false,false]});
  close(actual.realizedAnnualValue,actual.realizableAnnualValue*.35);
  assert.equal(actual.completedSteps,2);
  assert.equal(actual.totalSteps,5);
});

test('portfolio aggregation keeps capacity economics separate from cash semantics',()=>{
  const themes=PROFILE_DIMENSIONS.filter(item=>['operatie','finance','tech'].includes(item.id));
  const state={portal:{profile:{employees:24,hourlyCost:52,maturity:{operatie:2,finance:2,tech:2}},strategyDna:{execution:{operatie:[true,false,false,false,false],finance:[true,true,false,false,false],tech:[false,false,false,false,false]}}}};
  const actual=executionPortfolioMetrics({themes,state});
  assert.equal(actual.capacityNotCash,true);
  assert.equal(actual.totalSteps,15);
  assert.equal(actual.completedSteps,3);
  assert.ok(actual.realizableAnnualValue>actual.realizedAnnualValue);
  assert.ok(actual.realizedAnnualValue>0);
});
