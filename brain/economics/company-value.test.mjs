import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCompanyValue} from './company-value.mjs';

test('calculates expected net value payback realized profit variance and confidence adjusted value',()=>{
  const value=calculateCompanyValue({expectedValue:120000,investment:30000,actualCost:35000,realizedValue:100000,confidence:.75});
  assert.equal(value.expectedValue,120000);
  assert.equal(value.netExpectedValue,90000);
  assert.equal(value.paybackMonths,3);
  assert.equal(value.realizedValue,100000);
  assert.equal(value.realizedProfit,65000);
  assert.equal(value.variance,-20000);
  assert.equal(value.confidenceAdjustedValue,60000);
});

test('missing and zero data never create Infinity NaN or fictional value',()=>{
  const value=calculateCompanyValue({});
  assert.deepEqual(value,{expectedValue:0,investment:0,netExpectedValue:0,paybackMonths:null,actualCost:0,realizedValue:0,realizedProfit:0,variance:0,confidence:0,confidenceAdjustedValue:0,currency:'EUR'});
});

test('negative realized economics remain visible instead of being clamped away',()=>{
  const value=calculateCompanyValue({expectedValue:5000,investment:10000,actualCost:12000,realizedValue:3000,confidence:.5,currency:'EUR'});
  assert.equal(value.netExpectedValue,-5000);
  assert.equal(value.realizedProfit,-9000);
  assert.equal(value.variance,-2000);
  assert.equal(value.confidenceAdjustedValue,-7500);
});
