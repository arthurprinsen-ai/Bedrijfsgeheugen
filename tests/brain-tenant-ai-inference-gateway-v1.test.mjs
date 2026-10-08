import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTenantAiInference} from '../platform/api/tenant-ai-inference-handler.mjs';
import {signVerifiedRuntimeProof} from '../platform/runtime/attested-cloud-ai.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';
const now=1_000_000,key='test-server-only-key-0123456789abcdef0123456789';
const tenantId='tenant-a';
const profile={...CURRENT_AI_DEPLOYMENT_PROFILE,provider:'MISTRAL_API',modelFamily:'MISTRAL',modelId:'mistral-small-latest'};
const receipt={...profile,tenantId,useCaseId:'portal-project-answer',policyVersion:3,endpointId:'deployment-approved',
 evidenceId:'readback-proof-001',providerReadbackEvidenceId:'provider-readback-001',residencyEvidenceId:'residency-proof-001',
 dataProcessingEvidenceId:'dpa-proof-001',egressEvidenceId:'egress-allowlist-001',
 changeId:'sovereignty:tenant-a:3',customerConsentId:'customer-consent-3',
 status:'VERIFIED',verifier:'PROVIDER_READBACK',proofStatus:'ATTESTED',revoked:false,
 verifiedAt:now-12000,issuedAt:now-11000,validUntil:now+250000};
const approvedScopes=['privacy','security','ai_governance','data_residency','supplier_risk','finance','sustainability','csrd_esrs_scope','audit','customer_disclosure'];
const approval={tenantId,changeId:'sovereignty:tenant-a:3',policyVersion:3,status:'CLEARED',
 customerConsentId:'customer-consent-3',validUntil:now+220000,
 approvedScopes,evidenceIds:['readback-proof-001']};
const registry={'tenant-a':{
 crossDomainApproval:approval,
 approvedEndpoints:[{endpointId:'deployment-approved',tenantId,provider:'MISTRAL_API',
   region:'AUTO',networkMode:'STANDARD',enabled:true}],
 signedProof:signVerifiedRuntimeProof({receipt,key}),
 config:{MISTRAL_API:{apiKey:'private-secret',endpointId:'deployment-approved',
 providerReadbackEvidenceId:'provider-readback-001',egressEvidenceId:'egress-allowlist-001'}}
}};
const req=(body,method='POST')=>({method,headers:{get:()=>null},json:async()=>body});
const currentImpact={contract:'powerhouse-cross-domain-change-v1',tenantId,
 changeId:'sovereignty:tenant-a:3',kind:'AI_MODEL',changed:true,
 status:'REVIEW_REQUIRED',deploymentApproved:false};
const sovereignty={get:async tenant=>{assert.equal(tenant,tenantId);return {snapshot:{policy:{
 ai_deployment_profile:profile,policy_version:3,enforcement_mode:'BLOCK',
 last_change_impact:currentImpact
},violations:[]}}}};
const user={id:'owner-1'};
test('Identity tenant and server-side proof route data to exactly the approved Mistral model',async()=>{
 let calls=0;const result=await handleTenantAiInference({
  request:req({question:'Hello'}),user,tenantId,sovereignty,registry,proofKey:key,now,
  fetchFn:async(url,init)=>{
   calls++;assert.equal(url,'https://api.mistral.ai/v1/chat/completions');
   assert.equal(JSON.parse(init.body).messages[1].content,'Hello');
   return {ok:true,status:200,json:async()=>({choices:[{message:{content:'Hello, tenant.'}}]})};
  }
 });
 assert.equal(result.status,200);const json=await result.json();
 assert.equal(json.answer,'Hello, tenant.');
 assert.equal(json.provider,'MISTRAL_API');
 assert.equal(calls,1);
 assert.equal(JSON.stringify(json).includes('private-secret'),false);
});
test('tenant isolation, missing config and user-supplied model changes are denied before provider access',async()=>{
 let calls=0;const fetchFn=async()=>{calls++;throw Error('unexpected egress')};
 const base={request:req({question:'Hello'}),user,tenantId,sovereignty,registry,proofKey:key,now,fetchFn};
 assert.equal((await handleTenantAiInference({...base,tenantId:'tenant-b'})).status,503);
 assert.equal((await handleTenantAiInference({...base,user:null})).status,401);
 assert.equal((await handleTenantAiInference({...base,request:req({question:'Hello',provider:'ANTHROPIC'})})).status,422);
 assert.equal((await handleTenantAiInference({...base,request:req({question:'x'.repeat(6001)})})).status,422);
 assert.equal((await handleTenantAiInference({...base,registry:null})).status,503);
 assert.equal(calls,0);
});
test('unresolved EU sovereignty blocker, stale policy and invalid signature fail closed',async()=>{
 let calls=0;const fetchFn=async()=>{calls++;throw Error('unexpected egress')};
 const base={request:req({question:'Hello'}),user,tenantId,sovereignty,registry,proofKey:key,now,fetchFn};
 const blocked={get:async()=>({snapshot:{policy:{ai_deployment_profile:profile,policy_version:3,enforcement_mode:'BLOCK'},violations:[{kind:'ai_route',reason:'not checked'}]}})};
 assert.equal((await handleTenantAiInference({...base,sovereignty:blocked})).status,409);
 const stale={get:async()=>({snapshot:{policy:{ai_deployment_profile:profile,policy_version:4,enforcement_mode:'OBSERVE'},violations:[]}})};
 assert.equal((await handleTenantAiInference({...base,sovereignty:stale})).status,409);
 assert.equal((await handleTenantAiInference({...base,proofKey:'other-trust-key-0123456789abcdef0123456789'})).status,409);
 assert.equal(calls,0);
});
test('provider error never silently falls back to an alternative model',async()=>{
 let calls=0;const response=await handleTenantAiInference({
  request:req({question:'Hello'}),user,tenantId,sovereignty,registry,proofKey:key,now,
  fetchFn:async()=>{calls++;return {ok:false,status:500,json:async()=>({})};}
 });
 assert.equal(response.status,502);
 assert.deepEqual(await response.json(),{error:'AI_RUNTIME_PROVIDER_FAILED'});
 assert.equal(calls,1);
});

test('current immutable REVIEW_REQUIRED audit is not an execution deadlock after independently signed clearance',async()=>{
 let calls=0;
 const res=await handleTenantAiInference({
  request:req({question:'Approved inquiry'}),user,tenantId,sovereignty,registry,proofKey:key,now,
  fetchFn:async(url)=>{calls++;assert.equal(url,'https://api.mistral.ai/v1/chat/completions');
   return {ok:true,status:200,json:async()=>({choices:[{message:{content:'Verified answer'}}]})};}
 });
 assert.equal(res.status,200);
 assert.equal((await res.json()).answer,'Verified answer');
 assert.equal(calls,1);
});
test('different audit change identity or version blocks provider egress even if the signed proof is otherwise valid',async()=>{
 let calls=0;
 for(const stale of [
  {...currentImpact,changeId:'sovereignty:tenant-a:2'},
  {...currentImpact,tenantId:'tenant-b'},
  {...currentImpact,deploymentApproved:true},
  {status:'REVIEW_REQUIRED',deploymentApproved:false},
  null
 ]){
  const altered={get:async()=>({snapshot:{policy:{
   ai_deployment_profile:profile,policy_version:3,enforcement_mode:'OBSERVE',last_change_impact:stale
  },violations:[]}})};
  const res=await handleTenantAiInference({
   request:req({question:'Hello'}),user,tenantId,sovereignty:altered,registry,proofKey:key,now,
   fetchFn:async()=>{calls++;throw Error('must remain blocked')}
  });
  assert.equal(res.status,409);
  assert.deepEqual(await res.json(),{error:'CROSS_DOMAIN_REVIEW_REQUIRED'});
 }
 assert.equal(calls,0);
});
test('oversized text body is rejected without parsing or sending to a provider',async()=>{
 let calls=0;const input={method:'POST',headers:{get:()=>null},text:async()=>JSON.stringify({question:'x'.repeat(14000)})};
 const res=await handleTenantAiInference({request:input,user,tenantId,sovereignty,registry,proofKey:key,now,fetchFn:async()=>{calls++;return null}});
 assert.equal(res.status,413);assert.equal(calls,0);
});

test('EU-only processing and EU-only storage policies cannot approve AUTO or US residency',async()=>{
 let calls=0;
 const fetchFn=async()=>{calls++;throw Error('unexpected external egress')};
 const base={request:req({question:'Hello'}),user,tenantId,registry,proofKey:key,now,fetchFn};
 const policies=[
  {mode:'EU_ONLY',computeRegion:'AUTO',storageRegion:'EU',ragRegion:'SAME_AS_STORAGE'},
  {mode:'EU_ONLY',computeRegion:'EU',storageRegion:'US',ragRegion:'SAME_AS_STORAGE'},
  {mode:'EU_STORAGE',computeRegion:'AUTO',storageRegion:'US',ragRegion:'SAME_AS_STORAGE'},
  {mode:'EU_STORAGE',computeRegion:'AUTO',storageRegion:'EU',ragRegion:'US'}
 ];
 for(const row of policies){
  const restrictive={get:async()=>({snapshot:{policy:{
   mode:row.mode,ai_deployment_profile:{...profile,...row},
   policy_version:3,enforcement_mode:'BLOCK'
  },violations:[]}})};
  const res=await handleTenantAiInference({...base,sovereignty:restrictive});
  assert.equal(res.status,409);
  assert.equal((await res.json()).error,'SOVEREIGNTY_REGION_NOT_VERIFIED');
 }
 assert.equal(calls,0);
});

test('gateway denies egress when CSRD approval or endpoint allowlist is missing even with a signed receipt',async()=>{
 let calls=0;const fetchFn=async()=>{calls++;throw Error('must not egress')};
 for(const record of [
  {...registry[tenantId],crossDomainApproval:null},
  {...registry[tenantId],crossDomainApproval:{...approval,status:'REVIEW_REQUIRED'}},
  {...registry[tenantId],approvedEndpoints:[]},
  {...registry[tenantId],approvedEndpoints:[{...registry[tenantId].approvedEndpoints[0],tenantId:'other-tenant'}]}
 ]){
  const response=await handleTenantAiInference({request:req({question:'Hello'}),user,tenantId,
   sovereignty,registry:{[tenantId]:record},proofKey:key,now,fetchFn});
  assert.equal(response.status,409);
  assert.deepEqual(await response.json(),{error:'AI_RUNTIME_NOT_VERIFIED'});
 }
 assert.equal(calls,0);
});
