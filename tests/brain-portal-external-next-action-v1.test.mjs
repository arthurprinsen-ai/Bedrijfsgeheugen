import test from 'node:test';
import assert from 'node:assert/strict';
import {signalNextStep} from '../portal-v2/modules/entrepreneur-intelligence.js';
test('unverified external signal is not a completed order',()=>{const x=signalNextStep({signal_key:'x'},[]);assert.equal(x.linked,false);});
