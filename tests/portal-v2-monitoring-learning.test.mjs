import test from 'node:test';
import assert from 'node:assert/strict';
import {dedupeSignals,materialSignals} from '../portal-v2/operating-system/monitoring.js';
import {calibrateOutcome,learningExplanation} from '../portal-v2/operating-system/learning.js';

test('signals are deduped by underlying fingerprint and non-material noise is suppressed',()=>{
 const signals=[{type:'kpi',entity_id:'revenue',delta:2,confidence:.9},{type:'kpi',entity_id:'revenue',delta:3,confidence:.8},{type:'risk',entity_id:'security',delta:20,confidence:.9}];
 assert.equal(dedupeSignals(signals).length,2);
 assert.equal(materialSignals(signals,{min_abs_delta:10,min_confidence:.5}).length,1);
});

test('calibration compares expected and realized without rewriting history',()=>{
 const expected=Object.freeze({amount:100,kind:'estimated'}),realized=Object.freeze({amount:80,kind:'realized'});
 const out=calibrateOutcome(expected,realized,[]);
 assert.equal(out.error,-20);assert.equal(expected.amount,100);assert.equal(realized.amount,80);
 assert.match(learningExplanation(out),/20/);
});
