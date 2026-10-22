import test from 'node:test';
import assert from 'node:assert/strict';
import {pendingBedrijfslekReceipt} from '../scan-claim-bridge.js';

const now=Date.parse('2026-10-21T10:00:00Z');
const old='frisse-blik-11111111-1111-4111-8111-111111111111';
const latest='frisse-blik-22222222-2222-4222-8222-222222222222';
const validLegacy='bedrijfslek-33333333-3333-4333-8333-333333333333';
const storage=({v3=[],v2=null}={})=>({getItem:key=>key==='bg_scan_receipts_v3'?JSON.stringify(v3):key==='bg_last_scan_receipt_v2'?JSON.stringify(v2):null});

test('select newest valid v3 irrespective of persisted row ordering',()=>{
 const rows=[{at:now-900000,submission_key:old},{at:now-1000,submission_key:latest}];
 assert.equal(pendingBedrijfslekReceipt(storage({v3:rows}),null,now),latest);
 assert.equal(pendingBedrijfslekReceipt(storage({v3:rows.reverse()}),null,now),latest);
});
test('exclude malformed, expired and future v3 receipts',()=>{
 const rows=[{at:now-8*86400000,submission_key:old},{at:now+1,submission_key:old},{at:now-10,submission_key:'not-safe'},{at:now-1000,submission_key:latest}];
 assert.equal(pendingBedrijfslekReceipt(storage({v3:rows}),null,now),latest);
});
test('empty store never fabricates a claimable receipt',()=>{
 assert.equal(pendingBedrijfslekReceipt(storage(),null,now),null);
});
test('newer valid legacy v2 overrides older v3',()=>{
 const x={v3:[{at:now-90000,submission_key:old}],v2:{received_at:now-2000,submission_key:validLegacy}};
 assert.equal(pendingBedrijfslekReceipt(storage(x),null,now),validLegacy);
});
test('newer v3 overrides older legacy v2',()=>{
 const x={v3:[{at:now-2000,submission_key:latest}],v2:{received_at:now-90000,submission_key:validLegacy}};
 assert.equal(pendingBedrijfslekReceipt(storage(x),null,now),latest);
});
test('expired and future v2 never override a current v3',()=>{
 for(const received_at of [now-8*86400000,now+1]){
  const x={v3:[{at:now-3000,submission_key:old}],v2:{received_at,submission_key:validLegacy}};
  assert.equal(pendingBedrijfslekReceipt(storage(x),null,now),old);
 }
});
test('malformed v3 storage falls back to valid legacy v2',()=>{
 const s={getItem:key=>key==='bg_scan_receipts_v3'?'{invalid json':key==='bg_last_scan_receipt_v2'?JSON.stringify({received_at:now-100,submission_key:validLegacy}):null};
 assert.equal(pendingBedrijfslekReceipt(s,null,now),validLegacy);
});
test('session-only legacy reference remains a fallback, not proof of tenant identity',()=>{
 const session={getItem:()=>validLegacy};
 assert.equal(pendingBedrijfslekReceipt(storage(),session,now),validLegacy);
});
