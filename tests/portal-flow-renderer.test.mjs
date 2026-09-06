import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStatusClass, flowVisualState } from '../portal-next/portal-flow-renderer.js';
test('blocked stopt de lijn en gebruikt blocked statusklasse',()=>{assert.equal(renderStatusClass('blocked'),'is-blocked');assert.deepEqual(flowVisualState('blocked'),{line:'stopped',tone:'danger'})});
test('idle rendert geen flow',()=>assert.deepEqual(flowVisualState('idle'),{line:'hidden',tone:'muted'}));
test('running rendert animated dotted flow',()=>assert.deepEqual(flowVisualState('running'),{line:'animated',tone:'active'}));
