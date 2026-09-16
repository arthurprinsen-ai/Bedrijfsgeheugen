import test from 'node:test'; import assert from 'node:assert/strict'; import {evaluateShadowObservation} from '../scripts/brain/quality/production-shadow.mjs';
test('matching shadow stays match',()=>assert.equal(evaluateShadowObservation({id:'x',expected:1,observed:1}).status,'MATCH'));
test('drift opens canonical learning obligation',()=>assert.equal(evaluateShadowObservation({id:'x',expected:1,observed:2}).obligation.learning_authority,'BRAIN-CLOSED-LOOP-v1'));
