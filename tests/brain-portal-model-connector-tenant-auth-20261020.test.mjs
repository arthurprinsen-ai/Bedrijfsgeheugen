import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createConnectorApi} from '../assets/js/koppelingen/api.js';
import {tenantAiAuthorizationHeaders} from '../portal-v2/modules/tenant-ai-request-auth.js';

const identity=()=>({isDemo:()=>false,authHeaders:async()=>({authorization:'Bearer signed-tenant-jwt',accept:'application/json'})});

test('authenticated connector draft and activation send signed tenant bearer',async()=>{
 const received=[];
 const fetchFn=async(url,options)=>{
  received.push({url,options});
  return Response.json({status:'TEST_PASSED',id:'connector-1'});
 };
 const api=createConnectorApi({fetchFn,authHeaders:()=>identity().authHeaders()});
 await api.createDraft({template_id:'document-upload',name:'Een koppeling'});
 await api.activate('connector-1','persisted-test-execution');
 assert.equal(received.length,2);
 for(const call of received){
  assert.equal(call.options.headers.authorization,'Bearer signed-tenant-jwt');
  assert.equal(call.options.credentials,'same-origin');
  assert.equal(call.options.headers['content-type'],'application/json');
 }
 assert.equal(JSON.parse(received[1].options.body).testExecutionId,'persisted-test-execution');
});

test('connector API refuses missing identity before sending customer data',async()=>{
 let calls=0;
 const api=createConnectorApi({
  fetchFn:async()=>{calls++;return Response.json({})},
  authHeaders:async()=>({accept:'application/json'})
 });
 await assert.rejects(api.createDraft({sensitive:'do-not-transmit'}),/AUTH_TOKEN_UNAVAILABLE/);
 assert.equal(calls,0);
});

test('AI model gateway requests reuse exact tenant authorization and cannot override it',async()=>{
 const good=await tenantAiAuthorizationHeaders(identity(),{accept:'application/json',authorization:'Bearer forged'});
 assert.equal(good.authorization,'Bearer signed-tenant-jwt');
 await assert.rejects(tenantAiAuthorizationHeaders({isDemo:()=>true,authHeaders:async()=>({authorization:'Bearer demo'})}),/AUTH_TOKEN_UNAVAILABLE/);
 await assert.rejects(tenantAiAuthorizationHeaders({isDemo:()=>false,authHeaders:async()=>({})}),/AUTH_TOKEN_UNAVAILABLE/);
});

test('portal wiring attaches tenant identity to both AI requests and connector server request',async()=>{
 const [client,selector,server,shell]=await Promise.all([
  readFile(new URL('../assets/js/koppelingen/api.js',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/modules/ai-model-choice.js',import.meta.url),'utf8'),
  readFile(new URL('../netlify/functions/portal-connectors.mjs',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/page-shell.js',import.meta.url),'utf8')
 ]);
 assert.match(server,/getUser\(request\)/);
 assert.doesNotMatch(server,/getUser\(\)/);
 assert.match(shell,/createConnectorApi\(\{authHeaders:/);
 assert.match(client,/credentials:'same-origin'/);
 assert.match(selector,/tenantAiAuthorizationHeaders\(stateClient/);
 const occurrences=selector.match(/tenantAiAuthorizationHeaders\(stateClient/g)||[];
 assert.equal(occurrences.length,2,'readiness and inference must each send the bearer');
});
