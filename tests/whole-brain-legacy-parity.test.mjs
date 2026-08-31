import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateLegacyParity} from '../brain/operating-loop/legacy-parity.mjs';

test('legacy parity is proven only when every registered calculation has fixtures and matches tolerance',()=>{
  const registry=[
    {id:'calc-a',legacySource:'legacy/a.js',canonicalService:'brain/calc-a',fixtures:[{id:'f1',legacy:10,canonical:10}],tolerance:0},
    {id:'calc-b',legacySource:'legacy/b.js',canonicalService:'brain/calc-b',fixtures:[{id:'f1',legacy:3.14,canonical:3.1401}],tolerance:.001}
  ];
  const result=evaluateLegacyParity(registry,{expectedCalculationIds:['calc-a','calc-b']});
  assert.equal(result.status,'PROVEN'); assert.equal(result.proven,2); assert.equal(result.failed,0);
});

test('missing registrations or mismatched fixtures fail closed',()=>{
  const registry=[{id:'calc-a',legacySource:'legacy/a.js',canonicalService:'brain/calc-a',fixtures:[{id:'f1',legacy:10,canonical:11}],tolerance:0}];
  const result=evaluateLegacyParity(registry,{expectedCalculationIds:['calc-a','calc-b']});
  assert.equal(result.status,'NOT_PROVEN'); assert.ok(result.missing.includes('calc-b')); assert.equal(result.failed,1);
});
