import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyInspectorBoundary,TARGET } from '../tools/security/verify-instagram-repair-auth.mjs';

test('security guardian calls original endpoint anonymously with safe GET and POST only',async()=>{
 const calls=[];
 const good=await verifyInspectorBoundary(async(url,opts)=>{calls.push({url,method:opts.method,headers:opts.headers});return {status:opts.method==='GET'?405:401};});
 assert.ok(good.ok);
 assert.deepEqual(calls.map(x=>x.method),['GET','POST','POST']);
 assert.ok(calls.every(x=>x.url===TARGET));
 assert.equal(calls[1].headers?.authorization,undefined);
 assert.equal(calls[2].headers['x-repair-key'],'invalid-monitor-value');
});
test('fail closed on missing auth block, redirects and server errors',async()=>{
 for(const status of [200,202,302,400,403,429,500]){
  const bad=await verifyInspectorBoundary(async()=>({status}));
  assert.equal(bad.ok,false,'HTTP '+status+' must never pass');
 }
});
test('fail closed on network exceptions',async()=>{
 const out=await verifyInspectorBoundary(async()=>{throw new Error('network timeout')});
 assert.equal(out.ok,false);assert.equal(out.results.length,3);assert.ok(out.results.every(q=>q.status===null));
});
