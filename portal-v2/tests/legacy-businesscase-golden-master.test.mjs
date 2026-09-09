import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';
import { businessCaseMetrics, functionalSchema } from '../modules/functional-suite.js';

const close=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`expected ${actual} ≈ ${expected}`);

function mixedMaturity(){
  return Object.fromEntries(PROFILE_DIMENSIONS.map((item,index)=>[item.id,(index%5)+1]));
}

test('businesscase preserves the legacy per-dimension target calculation without downgrading mature dimensions',()=>{
  const state={portal:{
    profile:{employees:24,hourlyCost:52,maturity:mixedMaturity()},
    businessCase:{target:4,delay:12,investment:12000}
  }};
  const actual=businessCaseMetrics(state);

  close(actual.currentAnnualCost,38692.992);
  close(actual.targetAnnualCost,14476.384);
  close(actual.annualBenefit,24216.608);
  close(actual.delayCost,24216.608);
  close(actual.paybackMonths,5.9463323682656135);
  close(actual.netThreeYear,60649.824);
  assert.equal(actual.target,4);
  assert.equal(actual.delayMonths,12);
  assert.equal(actual.investment,12000);
});

test('businesscase keeps the immutable legacy defaults and does not apply the separate 70 percent execution-ladder factor',()=>{
  const state={portal:{profile:{employees:24,hourlyCost:52,maturity:{}}}};
  const actual=businessCaseMetrics(state);

  close(actual.currentAnnualCost,54853.344);
  close(actual.targetAnnualCost,15471.456);
  close(actual.annualBenefit,39381.888);
  close(actual.delayCost,39381.888);
  close(actual.investment,12000);
  assert.equal(actual.target,4);
  assert.equal(actual.delayMonths,12);
  assert.notEqual(actual.annualBenefit,39381.888*0.7);
});

test('businesscase input boundaries preserve the final legacy control contract',()=>{
  const fields=Object.fromEntries(functionalSchema('businesscase').map(field=>[field.id,field]));
  assert.equal(fields.target.min,2);
  assert.equal(fields.target.max,5);
  assert.equal(fields.delay.min,0);
  assert.equal(fields.delay.max,18);
  assert.equal(fields.delay.step,3);
});
