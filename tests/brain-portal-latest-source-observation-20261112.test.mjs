import test from 'node:test';
import assert from 'node:assert/strict';
import {dedupeSignals,materialSignals} from '../portal-v2/operating-system/monitoring.js';

const current=Object.freeze({type:'kpi',entity_id:'cta',source_id:'website',observed_at:'2026-11-12T12:00:00Z',delta:2,confidence:.9});
const historical=Object.freeze({...current,observed_at:'2026-11-11T12:00:00Z',delta:30});
test('historical replay rejects older high-amplitude source event in either delivery order',()=>{
 for(const batch of [[historical,current],[current,historical]]){
  assert.equal(dedupeSignals(batch).length,1);
  assert.equal(dedupeSignals(batch)[0].observed_at,current.observed_at);
  assert.equal(materialSignals(batch,{min_abs_delta:10,min_confidence:.5}).length,0);
 }
 assert.equal(current.delta,2);assert.equal(historical.delta,30);
});
test('same-observation-time tie selects the strongest without changing source history',()=>{
 const newer={...current,delta:12};
 for(const batch of [[newer,current],[current,newer]]){
  assert.equal(dedupeSignals(batch)[0].delta,12);
 }
});
test('observation with missing time cannot supplant dated current evidence',()=>{
 const undated={...current,observed_at:null,delta:999};
 assert.equal(dedupeSignals([current,undated])[0].delta,2);
});
