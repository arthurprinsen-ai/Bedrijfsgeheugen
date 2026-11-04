import test from 'node:test';
import assert from 'node:assert/strict';
import {validSourceReadiness} from '../tools/delivery/ftr-positive-admission-canary-20261104.mjs';
test('positive prebuild source is safe and has no provider activity',()=>{assert.deepEqual(validSourceReadiness(),{source:'verified',readOnly:true});});
