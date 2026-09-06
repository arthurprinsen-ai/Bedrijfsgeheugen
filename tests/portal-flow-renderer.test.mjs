import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStatusClass, flowVisualState, getPowerhouseRoute } from '../portal-next/portal-flow-renderer.js';
test('blocked stopt de lijn en gebruikt blocked statusklasse',()=>{assert.equal(renderStatusClass('blocked'),'is-blocked');assert.deepEqual(flowVisualState('blocked'),{line:'stopped',tone:'danger'})});
test('idle rendert geen flow',()=>assert.deepEqual(flowVisualState('idle'),{line:'hidden',tone:'muted'}));
test('running rendert animated dotted flow',()=>assert.deepEqual(flowVisualState('running'),{line:'animated',tone:'active'}));
test('powerhouse route loopt in vaste volgorde en stopt bij blocker',()=>{const route=getPowerhouseRoute({powerhouse:[{category:'verificatie',status:'waiting'},{category:'analyse',status:'blocked'},{category:'detectie',status:'verified'},{category:'uitvoering',status:'running'}]});assert.deepEqual(route.map(a=>a.category),['detectie','analyse'])});
test('idle powerhouse agents worden niet als flowsegment getekend',()=>{const route=getPowerhouseRoute({powerhouse:[{category:'detectie',status:'idle'},{category:'analyse',status:'running'}]});assert.deepEqual(route.map(a=>a.category),['analyse'])});
