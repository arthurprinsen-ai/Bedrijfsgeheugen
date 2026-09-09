import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';
import { executionThemeMetrics, executionValueSummary, EXECUTION_LADDER_SHARES } from '../modules/strategy-execution.js';

const close=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`expected ${actual} ≈ ${expected}`);
const maturity=Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,2]));

function state(execution={}){
  return {portal:{profile:{employees:24,hourlyCost:52,maturity},strategy:{execution}}};
}

test('legacy execution ladder keeps the exact special and standard step shares',()=>{
  assert.deepEqual(EXECUTION_LADDER_SHARES.mensen,[.05,.20,.35,.25,.15]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.tech,[.05,.15,.45,.20,.15]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.analytics,[.05,.20,.40,.20,.15]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.operatie,[.10,.25,.35,.20,.10]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.finance,[.10,.20,.40,.20,.10]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.commercie,[.10,.20,.40,.20,.10]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.service,[.10,.25,.35,.20,.10]);
  assert.deepEqual(EXECUTION_LADDER_SHARES.security,[.15,.30,.25,.20,.10]);
  for(const id of ['sturing','quality','governance','culture','duurzaam']){
    assert.deepEqual(EXECUTION_LADDER_SHARES[id],[.10,.25,.35,.20,.10]);
  }
});

test('execution theme potential is exactly 70 percent of current annual handwork cost',()=>{
  const actual=executionThemeMetrics(state(),'tech');
  close(actual.currentAnnualCost,4.1*.78*46*52);
  close(actual.potentialValue,actual.currentAnnualCost*.7);
  close(actual.realizedValue,0);
  assert.equal(actual.completedSteps,0);
});

test('realized execution value uses each completed legacy step share and never exceeds potential',()=>{
  const actual=executionThemeMetrics(state({tech:[true,false,true,false,false]}),'tech');
  close(actual.realizedValue,actual.potentialValue*(.05+.45));
  close(actual.realizedShare,.50);
  assert.equal(actual.completedSteps,2);
});

test('summary only values the themes in scope, matching legacy execution selection semantics',()=>{
  const s=state({mensen:[true,true,false,false,false],security:[true,false,false,false,false]});
  const actual=executionValueSummary(s,['mensen','security']);
  const people=executionThemeMetrics(s,'mensen');
  const security=executionThemeMetrics(s,'security');
  close(actual.potentialValue,people.potentialValue+security.potentialValue);
  close(actual.realizedValue,people.realizedValue+security.realizedValue);
  assert.equal(actual.completedSteps,3);
  assert.equal(actual.totalSteps,10);
});
