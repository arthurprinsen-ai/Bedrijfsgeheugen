import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authorizedScanHeaders,pendingBedrijfslekReceipt,createScanClaimBridge} from '../portal-v2/scan-claim-bridge.js';

const fakeStore=initial=>{
 const m=new Map(Object.entries(initial||{}));
 return {getItem:key=>m.get(key)||null,setItem:(key,val)=>m.set(key,val),removeItem:key=>m.delete(key),peek:key=>m.get(key)};
};
const KEY='bedrijfslek-20261009-validated';
const REC='bg_last_scan_receipt_v2';
test('canonical customer JWT is obligatory for scan history and claim',()=>{
 assert.deepEqual(authorizedScanHeaders({authorization:'Bearer user.jwt-example'}),{accept:'application/json',authorization:'Bearer user.jwt-example'});
 for(const headers of [null,{}, {authorization:''},{authorization:'Basic attacker'},{authorization:'Bearer'},{authorization:'Bearer a b'}]){
   assert.throws(()=>authorizedScanHeaders(headers),/AUTH_TOKEN_UNAVAILABLE/);
 }
});
test('scan proof survives a new tab but expires and does not contain user contact data',()=>{
 const now=Date.now();
 const local=fakeStore({[REC]:JSON.stringify({submission_key:KEY,received_at:now-1000})});
 assert.equal(pendingBedrijfslekReceipt(local,fakeStore(),now),KEY);
 assert.equal(pendingBedrijfslekReceipt(local,fakeStore(),now+8*86400000),null);
 assert.equal(pendingBedrijfslekReceipt(fakeStore({[REC]:JSON.stringify({submission_key:'tenant:any',received_at:now})}),fakeStore(),now),null);
 assert.equal(pendingBedrijfslekReceipt(fakeStore(),fakeStore({bg_last_scan_ref:KEY}),now),KEY);
});
function fakeDom(){
 const nodes=[];
 function node(tag){const o={tag,style:{},children:[],hidden:false,textContent:'',disabled:false,
    setAttribute(){},append(...items){this.children.push(...items)},
    appendChild(item){this.children.push(item)},replaceChildren(){this.children=[]},
    addEventListener(name,handler){(this.listeners??={})[name]=handler},
    before(item){nodes.push(item)}};nodes.push(o);return o}
 const mount=node('mount');
 const doc={querySelector:selector=>selector==='.main .executive-glance'?mount:null,createElement:node};
 return {doc,nodes};
}
test('authenticated Portal V2 attaches Bearer token to GET and POST; claim is explicit and server-verified',async()=>{
 const {doc,nodes}=fakeDom();
 const local=fakeStore({[REC]:JSON.stringify({submission_key:KEY,received_at:Date.now()})});
 const session=fakeStore({bg_last_scan_ref:KEY});
 const calls=[];
 const fetcher=async(url,opts)=>{calls.push({url,...opts});return {status:200,ok:true,json:async()=>opts.method==='POST'?{ok:true,claimed:true,scan:{tenant_identity_status:'verified'}}:{ok:true,scans:[]}}};
 const bridge=createScanClaimBridge({doc,storage:local,session,fetcher,authHeaders:async()=>({authorization:'Bearer test.jwt'})});
 const button=nodes.find(x=>x.tag==='button');
 bridge.setAuthenticated(true,'customer-A');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,1);
 assert.equal(calls[0].headers.authorization,'Bearer test.jwt');
 await button.listeners.click();
 assert.equal(calls.filter(x=>x.method==='POST').length,1);
 assert.equal(calls.find(x=>x.method==='POST').headers.authorization,'Bearer test.jwt');
 assert.equal(local.peek(REC),undefined);
 assert.equal(session.peek('bg_last_scan_ref'),undefined);
 bridge.setAuthenticated(false);
 assert.equal(calls.length,3);
});
test('missing token is fail closed: neither history nor claim reaches API',async()=>{
 const {doc,nodes}=fakeDom(),local=fakeStore({[REC]:JSON.stringify({submission_key:KEY,received_at:Date.now()})});
 const calls=[];
 const bridge=createScanClaimBridge({doc,storage:local,session:fakeStore(),fetcher:async(...args)=>{calls.push(args);throw Error('should not call')},authHeaders:async()=>({})});
 bridge.setAuthenticated(true,'customer-A');
 await new Promise(resolve=>setImmediate(resolve));
 const button=nodes.find(x=>x.tag==='button');
 await button.listeners.click();
 assert.equal(calls.length,0);
 assert.notEqual(local.peek(REC),undefined);
});
test('source wiring preserves tenant-switch isolation and verified ownership',()=>{
 const app=readFileSync('portal-v2/app.js','utf8');
 const source=readFileSync('portal-v2/scan-claim-bridge.js','utf8');
 const edge=readFileSync('supabase/functions/powerhouse-scan-ingest/index.ts','utf8');
 const scan=readFileSync('zelfscan.html','utf8');
 assert.match(app,/authHeaders:\(\)=>portalStateClient\.authHeaders\(\)/);
 assert.match(app,/setAuthenticated\(authenticated,snap\.user\?\.id\)/);
 assert.match(app,/snap\.mode==='empty'/);
 assert.match(source,/nextIdentity===identityKey/);
 assert.match(source,/scan\?\.tenant_identity_status!=='verified'/);
 assert.match(edge,/scan\.tenant_identity_status==='verified'/);
 assert.match(edge,/scan\.company_key!==companyKey/);
 assert.match(edge,/else patch\.klant_slug=tenantId/);
 assert.match(scan,/bg_last_scan_receipt_v2/);
 assert.doesNotMatch(source,/x-bg-service-token/);
});
