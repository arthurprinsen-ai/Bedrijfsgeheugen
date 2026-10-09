import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanClaimBridge} from '../portal-v2/scan-claim-bridge.js';

class FakeNode {
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners=new Map();this.style={};this.hidden=false;this.disabled=false;this.textContent='';}
  append(...children){this.children.push(...children);}
  appendChild(value){this.children.push(value);return value;}
  replaceChildren(...children){this.children=[...children];}
  setAttribute(name,value){this.attrs[name]=value;}
  addEventListener(name,listener){this.listeners.set(name,listener);}
}
function fakeDom(key='bedrijfslek-test-a13bb354-a8fa-4db6-8bcb-86a3ccf11ac9'){
  let section;
  const mount={before(value){section=value;}};
  const doc={createElement(tag){return new FakeNode(tag);},querySelector(selector){return selector==='.main .executive-glance'?mount:null;}};
  const values=new Map([['bg_last_scan_ref',key]]);
  const storage={getItem(name){return values.get(name)||null;},setItem(name,value){values.set(name,value);},removeItem(name){values.delete(name);}};
  return {doc,storage,section:()=>section,values};
}
const answer=(body,status=200)=>({ok:status<400,status,json:async()=>body});
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('canonical Portal V2 JWT is sent on both history and explicit claim; no tenant id from browser',async()=>{
  const x=fakeDom();const calls=[];
  const fetcher=async(url,options)=>{
    calls.push({url,...options});
    if(options.method==='POST')return answer({ok:true,claimed:true});
    return answer({ok:true,scans:[{soort:'bedrijfslek_scan',tenant_identity_status:'verified',score:58,scan_datum:'2026-10-09'}]});
  };
  const bridge=createScanClaimBridge({doc:x.doc,storage:x.storage,fetcher,authHeaders:async()=>({authorization:'Bearer valid-identity-jwt'})});
  bridge.setAuthenticated(true);
  await settle();
  assert.equal(calls.length,1);
  assert.equal(calls[0].headers.authorization,'Bearer valid-identity-jwt');
  assert.equal(calls[0].url,'/api/portal-scans');
  assert.equal(calls[0].credentials,'same-origin');
  assert.equal(x.section().children[2].hidden,false);
  const click=x.section().children[2].listeners.get('click');
  await click();
  await settle();
  assert.equal(calls.length,3);
  const post=calls.find(call=>call.method==='POST');
  assert.equal(post.headers.authorization,'Bearer valid-identity-jwt');
  assert.equal(post.headers['content-type'],'application/json');
  assert.deepEqual(Object.keys(JSON.parse(post.body)),['submission_key']);
  assert.equal(x.storage.getItem('bg_last_scan_ref'),null);
  assert.equal(x.section().children[2].hidden,true);
});

test('missing JWT fails closed before privileged fetch or claim',async()=>{
  const x=fakeDom();const calls=[];
  const bridge=createScanClaimBridge({doc:x.doc,storage:x.storage,fetcher:async()=>{calls.push(1);return answer({});},authHeaders:async()=>({accept:'application/json'})});
  bridge.setAuthenticated(true);await settle();
  assert.equal(calls.length,0);
  await x.section().children[2].listeners.get('click')();await settle();
  assert.equal(calls.length,0);
  assert.ok(x.storage.getItem('bg_last_scan_ref'),'receipt must survive auth failure');
  assert.match(x.section().children[3].textContent,/niet gelukt/i);
  bridge.setAuthenticated(false);
  assert.equal(x.section().hidden,true);
});

test('signout while token is resolving prevents stale account request',async()=>{
  const x=fakeDom();let finish;
  const calls=[];
  const pending=new Promise(resolve=>{finish=resolve;});
  const bridge=createScanClaimBridge({doc:x.doc,storage:x.storage,fetcher:async(...args)=>{calls.push(args);return answer({});},authHeaders:()=>pending});
  bridge.setAuthenticated(true);
  bridge.setAuthenticated(false);
  finish({authorization:'Bearer obsolete-jwt'});
  await settle();
  assert.equal(calls.length,0);
  assert.equal(x.section().hidden,true);
});

test('Bridge cannot initialize without a canonical identity token provider',()=>{
  const x=fakeDom();
  assert.throws(()=>createScanClaimBridge({doc:x.doc,storage:x.storage}),/PORTAL_SCAN_AUTH_HEADERS_REQUIRED/);
});

test('existing canonical API boundary still resolves tenant from Netlify Identity only',async()=>{
  const {readFile}=await import('node:fs/promises');
  const api=await readFile(new URL('../netlify/functions/portal-scans.mjs',import.meta.url),'utf8');
  const portal=await readFile(new URL('../portal-v2/app.js',import.meta.url),'utf8');
  assert.match(portal,/createScanClaimBridge\(\{authHeaders:\(\)=>portalStateClient\.authHeaders\(\)\}\)/);
  assert.match(api,/const user=await getUser\(\)/);
  assert.match(api,/resolveIdentityTenant\(user\)/);
  assert.match(api,/action:'claim',tenant_id:tenantId,submission_key:submissionKey/);
  assert.doesNotMatch(api,/body\?\.tenant_id/);
});
