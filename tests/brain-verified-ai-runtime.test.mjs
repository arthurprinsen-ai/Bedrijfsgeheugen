import test from 'node:test';
import assert from 'node:assert/strict';
import {selectVerifiedAiRuntime,invokeVerifiedAiRuntime} from '../platform/brain/verified-ai-runtime.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE as profile} from '../platform/policy/customer-ai-deployment.mjs';
const now=1_000_000;
const receipt={...profile,tenantId:'a',status:'VERIFIED',verifiedAt:now-1000,validUntil:now+1000,evidenceId:'proof-1',endpointId:'endpoint-1',revoked:false,changeId:'chg-1',policyVersion:2,customerConsentId:'consent-1'};
const approvedScopes=['privacy','security','ai_governance','data_residency','supplier_risk','finance','sustainability','csrd_esrs_scope','audit','customer_disclosure'];
const approval={tenantId:'a',changeId:'chg-1',policyVersion:2,status:'CLEARED',customerConsentId:'consent-1',validUntil:now+1000,approvedScopes,evidenceIds:['proof-1']};
const endpointRegistry=new Map([['endpoint-1',{tenantId:'a',provider:'ANTHROPIC',region:'EU',networkMode:'STANDARD',enabled:true}]]);
const trusted=(overrides={})=>({tenantId:'a',profile,request:{content:'private'},loadVerifiedReceipt:async()=>receipt,loadCrossDomainApproval:async()=>approval,endpointRegistry,now,...overrides});
const deny=async options=>assert.rejects(invokeVerifiedAiRuntime(options),{code:'AI_RUNTIME_NOT_VERIFIED'});

test('only exact verified tenant runtime may be selected',()=>{
 assert.equal(selectVerifiedAiRuntime({tenantId:'a',profile,receipt,now}).endpointId,'endpoint-1');
 for(const bad of [{...receipt,tenantId:'b'},{...receipt,status:'REQUESTED'},{...receipt,validUntil:now-1},{...receipt,provider:'MISTRAL_API'},{...receipt,revoked:true},{...receipt,evidenceId:''}]){
  assert.throws(()=>selectVerifiedAiRuntime({tenantId:'a',profile,receipt:bad,now}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 }
});
test('caller-supplied verified receipt and absent trusted authority are never sufficient',async()=>{
 let dispatched=0;
 const adapters={ANTHROPIC:()=>{dispatched++;return 'unsafe';}};
 await deny({tenantId:'a',profile,receipt,request:{content:'private'},adapters,now});
 await deny({tenantId:'a',profile,request:{content:'private'},adapters,now});
 await deny(trusted({loadVerifiedReceipt:async()=>{throw new Error('unavailable');},adapters}));
 assert.equal(dispatched,0);
});
test('pending CSRD review, wrong tenant, revoked consent or expired approval deny egress',async()=>{
 let dispatched=0;
 const adapters={ANTHROPIC:()=>{dispatched++;return 'unsafe';}};
 for(const bad of [
  {...approval,status:'REVIEW_REQUIRED'},
  {...approval,tenantId:'b'},
  {...approval,customerConsentId:'different'},
  {...approval,validUntil:now-1},
  {...approval,approvedScopes:approvedScopes.filter(s=>s!=='csrd_esrs_scope')},
  {...approval,evidenceIds:[]}
 ]){
  await deny(trusted({loadCrossDomainApproval:async()=>bad,adapters}));
 }
 await deny(trusted({loadVerifiedReceipt:async()=>({...receipt,customerConsentId:''}),adapters}));
 await deny(trusted({loadCrossDomainApproval:async()=>{throw Error('cannot read');},adapters}));
 assert.equal(dispatched,0);
});
test('no arbitrary endpoint URL, cross-tenant registry, region mismatch or adapter fallback',async()=>{
 let called=0;
 const adapters={MISTRAL_API:()=>{called++;return 'wrong-provider';},ANTHROPIC:()=>{called++;return 'wrong-endpoint';}};
 await deny(trusted({endpointRegistry:new Map(),adapters}));
 await deny(trusted({endpointRegistry:new Map([['endpoint-1',{tenantId:'b',provider:'ANTHROPIC',region:'EU',networkMode:'STANDARD',enabled:true}]]),adapters}));
 await deny(trusted({endpointRegistry:new Map([['endpoint-1',{tenantId:'a',provider:'ANTHROPIC',region:'EU',networkMode:'STANDARD',enabled:false}]]),adapters}));
 await deny(trusted({adapters:{MISTRAL_API:adapters.MISTRAL_API}}));
 assert.equal(called,0);
});
test('approved trusted runtime dispatches exactly once with unchanged private request',async()=>{
 let called=0;
 const response=await invokeVerifiedAiRuntime(trusted({
  adapters:{ANTHROPIC:({route,request})=>{
   called++;
   assert.equal(route.evidenceId,'proof-1');
   assert.equal(route.endpointId,'endpoint-1');
   assert.equal(request.content,'private');
   return {ok:true};
  }}
 }));
 assert.deepEqual(response,{ok:true});
 assert.equal(called,1);
});
