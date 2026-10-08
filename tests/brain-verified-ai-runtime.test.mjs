import test from 'node:test';
import assert from 'node:assert/strict';
import {selectVerifiedAiRuntime,invokeVerifiedAiRuntime} from '../platform/brain/verified-ai-runtime.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE as profile} from '../platform/policy/customer-ai-deployment.mjs';
const now=1_000_000;
const receipt={...profile,tenantId:'a',status:'VERIFIED',verifiedAt:now-1000,validUntil:now+1000,evidenceId:'proof-1',endpointId:'endpoint-1',revoked:false};
test('only exact verified tenant runtime may be selected',()=>{
  assert.equal(selectVerifiedAiRuntime({tenantId:'a',profile,receipt,now}).endpointId,'endpoint-1');
  for(const bad of [{...receipt,tenantId:'b'},{...receipt,status:'REQUESTED'},{...receipt,validUntil:now-1},{...receipt,provider:'MISTRAL_API'},{...receipt,revoked:true},{...receipt,evidenceId:''}]){
    assert.throws(()=>selectVerifiedAiRuntime({tenantId:'a',profile,receipt:bad,now}),{code:'AI_RUNTIME_NOT_VERIFIED'});
  }
});
test('unavailable adapter never falls back',async()=>{
  await assert.rejects(invokeVerifiedAiRuntime({tenantId:'a',profile,receipt,request:{content:'private'},adapters:{MISTRAL_API:()=> 'unsafe'},now}),{code:'AI_RUNTIME_NOT_VERIFIED'});
});
test('authorized adapter receives only its exact route',async()=>{
  let count=0;
  const result=await invokeVerifiedAiRuntime({tenantId:'a',profile,receipt,request:{content:'test'},adapters:{ANTHROPIC:({route,request})=>{count++;assert.equal(route.evidenceId,'proof-1');return request.content;}},now});
  assert.equal(result,'test');assert.equal(count,1);
});
