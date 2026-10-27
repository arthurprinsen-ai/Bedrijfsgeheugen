import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPortalAction} from '../portal-v2/powerhouse-runtime-bridge.js';
import {normalizeBrainRecord} from '../brain/operating-loop/model.mjs';

test('Portal intelligence action intent is a canonical Brain Action',()=>{
  const raw=buildPortalAction({
    detail:{label:'Marge verbeteren',sourceType:'future_lens',scenario:'base',horizon:6,confidence:82,action:'create_action'},
    correlationId:'PORTAL_INPUT-rev-99',
    predecessorIds:['PORTAL_EVIDENCE-e1'],
    id:'action-1',
    idempotencyKey:'portal-action:test'
  });
  const record=normalizeBrainRecord({...raw,tenantId:'tenant-test'});
  assert.equal(record.kind,'action');
  assert.equal(record.status,'REQUESTED');
  assert.equal(record.executed,false);
  assert.equal(record.correlationId,'PORTAL_INPUT-rev-99');
  assert.deepEqual(record.predecessorIds,['PORTAL_EVIDENCE-e1']);
  assert.equal(record.payload.intent,'create_action');
  assert.equal(record.payload.sourceType,'future_lens');
});

test('Portal action intent keeps idempotency and bounded context',()=>{
  const raw=buildPortalAction({
    detail:{label:'x'.repeat(500),sourceType:'semantic_visual',action:'create_action'},
    id:'action-2',
    idempotencyKey:'same-intent'
  });
  assert.equal(raw.idempotencyKey,'same-intent');
  assert.ok(raw.payload.label.length<=220);
  assert.equal(raw.type,'Action');
});
