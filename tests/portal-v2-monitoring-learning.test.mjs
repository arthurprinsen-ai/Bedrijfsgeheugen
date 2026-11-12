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

test('latest observed source wins even when a stale incoming delta is bigger',()=>{
 const now={type:'kpi',entity_id:'cta',source_id:'site',delta:2,confidence:.9,observed_at:'2026-11-12T12:00:00Z'};
 const old={...now,delta:30,observed_at:'2026-11-11T12:00:00Z'};
 for(const events of [[now,old],[old,now]]){
  assert.equal(dedupeSignals(events).length,1);
  assert.equal(dedupeSignals(events)[0].delta,2);
  assert.equal(materialSignals(events,{min_abs_delta:10,min_confidence:.5}).length,0);
 }
 assert.equal(now.delta,2);assert.equal(old.delta,30);
});
test('only equal observed source times use magnitude as deterministic tie-breaker',()=>{
 const a={type:'kpi',entity_id:'revenue',source_id:'ga4',delta:2,confidence:.9,observed_at:'2026-11-12T08:00:00Z'},b={...a,delta:12};
 assert.equal(dedupeSignals([a,b])[0].delta,12);
 assert.equal(dedupeSignals([b,a])[0].delta,12);
});
test('undated larger historical signals cannot supersede an observed current fact',()=>{
 const current={type:'market',entity_id:'competitor',source_id:'provider',delta:1,confidence:.8,observed_at:'2026-11-12T08:00:00Z'};
 const undated={...current,observed_at:null,delta:100};
 assert.equal(dedupeSignals([current,undated])[0].delta,1);
});
