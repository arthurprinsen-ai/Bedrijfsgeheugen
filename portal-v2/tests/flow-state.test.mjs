import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveFlowState, statusLabel } from '../flow-state.js';

test('idle without source',()=>{
  assert.deepEqual(deriveFlowState(),{sourceFlow:false,processingFlow:false,outputFlow:false,status:'idle',reason:'no-source'});
});

test('selection alone never claims runtime flow',()=>{
  const state=deriveFlowState({source:'documenten',module:'inzicht'});
  assert.equal(state.status,'selected');
  assert.equal(state.sourceFlow,false);
  assert.equal(state.processingFlow,false);
  assert.equal(state.outputFlow,false);
});

test('explicit preview may animate the full example route',()=>{
  const state=deriveFlowState({source:'documenten',module:'inzicht',preview:true});
  assert.equal(state.status,'preview');
  assert.equal(state.sourceFlow,true);
  assert.equal(state.processingFlow,true);
  assert.equal(state.outputFlow,true);
  assert.equal(statusLabel(state.status),'Voorbeeldflow');
});

test('blocked runtime stops before processing and output',()=>{
  const state=deriveFlowState({source:'systemen',module:'doen',runtime:{status:'blocked',reason:'connector-paused'}});
  assert.equal(state.sourceFlow,true);
  assert.equal(state.processingFlow,false);
  assert.equal(state.outputFlow,false);
  assert.equal(state.reason,'connector-paused');
});

test('verified runtime can expose proven output flow',()=>{
  const state=deriveFlowState({source:'systemen',module:'doen',runtime:{status:'verified'}});
  assert.equal(state.status,'verified');
  assert.equal(state.sourceFlow,true);
  assert.equal(state.processingFlow,true);
  assert.equal(state.outputFlow,true);
});
