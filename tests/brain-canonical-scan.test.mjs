import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeScanEnvelope,buildRuntimeEvent,SCAN_CONTRACT} from '../platform/scans/canonical-scan.mjs';
import vm from 'node:vm';

test('scan persistence acknowledges only real server receipts and retries the same submission',async()=>{
  const source=await readFile(new URL('../assets/scan-persistence.js',import.meta.url),'utf8');
  const values=new Map(),sent=[];
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const context={console,Map,Date,JSON,Promise,Error,setTimeout:fn=>fn(),sessionStorage:storage,localStorage:storage,addEventListener:()=>{},fetch:async(_,options)=>{
    sent.push(JSON.parse(options.body));
    return sent.length===1?{ok:true,json:async()=>({ok:true})}:{ok:true,json:async()=>({ok:true,scan_id:'scan-1',event_id:'event-1'})};
  }};context.window=context;vm.runInNewContext(source,context);
  const result=await context.BGScanPersistence.save(valid);
  assert.equal(result.scan_id,'scan-1');assert.equal(sent.length,2);
  assert.equal(sent[0].submission_key,sent[1].submission_key);
  const receipts=JSON.parse(values.get('bg_scan_receipts_v3'));
  assert.equal(receipts[0].submission_key,valid.submission_key);
  assert.equal(values.has('bg_scan_outbox_v3'),false);
});

test('a scan write failure remains recoverable and is never labelled stored',async()=>{
  const source=await readFile(new URL('../assets/scan-persistence.js',import.meta.url),'utf8');
  const values=new Map(),states=[];
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const context={Map,Date,JSON,Promise,Error,setTimeout:fn=>fn(),sessionStorage:storage,localStorage:storage,addEventListener:()=>{},fetch:async()=>{throw Error('offline')}};
  context.window=context;vm.runInNewContext(source,context);
  await assert.rejects(()=>context.BGScanPersistence.save(valid,s=>states.push(s)),/SCAN_NOT_STORED/);
  assert.ok(values.has('bg_scan_outbox_v3'));assert.equal(values.has('bg_scan_receipts_v3'),false);
  assert.equal(states.at(-1),'pending');
});
const valid={submission_key:'scan-20260915-abcdef',canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',scan:{score:67,niveau:3,dimAvg:{strategie:3.2,data:2.8}}};
test('canonical contract is stable',()=>assert.equal(SCAN_CONTRACT,'powerhouse-canonical-scan-loop-v1'));
test('public website data cannot assert verified company identity',()=>{const s=normalizeScanEnvelope({...valid,scan:{...valid.scan,company_key:'untrusted'}});assert.equal(s.companyKey,null);assert.equal(s.tenantIdentityStatus,'unverified');});
test('invalid score and foreign canonical fail closed',()=>{assert.throws(()=>normalizeScanEnvelope({...valid,scan:{...valid.scan,score:101}}),/INVALID_SCORE/);assert.throws(()=>normalizeScanEnvelope({...valid,canonical:'https://example.com/frisse-blik'}),/INVALID_CANONICAL/);});
test('runtime event is idempotent and aggregate-only until identity is verified',()=>{const e=buildRuntimeEvent(normalizeScanEnvelope(valid),'id-1','2026-09-15T18:00:00Z');assert.equal(e.dedupe_key,'scan:scan-20260915-abcdef');assert.equal(e.context.learning_scope,'aggregate_only');assert.equal(e.context.tenant_identity_status,'unverified');});
test('public scan proxy blocks privileged history and claim actions',async()=>{const source=await readFile(new URL('../netlify/functions/powerhouse-scan-ingest.mjs',import.meta.url),'utf8');assert.match(source,/PRIVILEGED_ACTION_FORBIDDEN/);assert.match(source,/body\?\.action==='history'/);assert.match(source,/body\?\.action==='claim'/);assert.match(source,/scan-public-proxy-v2/);});
