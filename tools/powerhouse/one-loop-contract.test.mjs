import test from 'node:test';
import assert from 'node:assert/strict';
import {transition,actionKey} from './one-loop-contract.mjs';
const ctx={tenantId:'tenant-a',correlationId:'corr-1',evidence:['receipt-1']};
test('valid lifecycle requires evidence',()=>{assert.equal(transition('EXECUTED','VERIFIED',ctx).state,'VERIFIED');assert.throws(()=>transition('EXECUTED','VERIFIED',{...ctx,evidence:[]}),/EVIDENCE/);});
test('rejects skipped or repeated transitions',()=>{assert.throws(()=>transition('PROPOSED','CLOSED',ctx),/TRANSITION/);assert.throws(()=>transition('CLOSED','CLOSED',ctx),/TRANSITION/);});
test('retries are bounded by valid states',()=>{assert.equal(transition('LEASED','RETRY_WAIT',ctx).state,'RETRY_WAIT');assert.equal(transition('RETRY_WAIT','QUEUED',ctx).state,'QUEUED');});
test('keys are stable and tenant scoped',()=>{const a={tenantId:'a',sourceFingerprint:'s',actionType:'email',subject:'lead'};assert.equal(actionKey(a),actionKey({...a}));assert.notEqual(actionKey(a),actionKey({...a,tenantId:'b'}));});
