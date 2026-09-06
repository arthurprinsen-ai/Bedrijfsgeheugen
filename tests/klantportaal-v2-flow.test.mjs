import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveFlowState } from '../portal-v2/flow-state.js';

test('geen bron betekent geen flow',()=>{
  assert.deepEqual(deriveFlowState({}),{sourceFlow:false,processingFlow:false,outputFlow:false,status:'idle',reason:'no-source'});
});

test('selectie zonder runtime evidence claimt geen flow',()=>{
  assert.deepEqual(deriveFlowState({source:'documenten',module:'inzicht'}),{sourceFlow:false,processingFlow:false,outputFlow:false,status:'selected',reason:'no-runtime-evidence'});
});

test('expliciete preview mag dotted voorbeeldflow tonen',()=>{
  assert.deepEqual(deriveFlowState({source:'documenten',module:'inzicht',preview:true}),{sourceFlow:true,processingFlow:true,outputFlow:true,status:'preview',reason:'explicit-preview'});
});

test('blocked stopt na bron en loopt niet door naar portaal',()=>{
  assert.deepEqual(deriveFlowState({source:'systemen',module:'doen',runtime:{status:'blocked',reason:'agent-paused'}}),{sourceFlow:true,processingFlow:false,outputFlow:false,status:'blocked',reason:'agent-paused'});
});

test('verified runtime met module laat volledige route zien',()=>{
  assert.deepEqual(deriveFlowState({source:'processen',module:'roadmap',runtime:{status:'verified'}}),{sourceFlow:true,processingFlow:true,outputFlow:true,status:'verified',reason:'runtime-evidence'});
});
