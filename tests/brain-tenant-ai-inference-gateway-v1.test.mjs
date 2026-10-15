import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTenantAiInference} from '../platform/api/tenant-ai-inference-handler.mjs';
import {signVerifiedRuntimeProof} from '../platform/runtime/attested-cloud-ai.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';
import {evaluateTenantModelChoice} from '../platform/policy/tenant-model-choice.mjs';
import {resolveDesiredTenantModel} from '../platform/policy/tenant-ai-default-model.mjs';
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

const selectedModel='mistral-medium-3-5',exactApi='mistral-medium-3-5';
const catalogModel={id:selectedModel,provider:'Mistral AI',status:'active',provider_api_id:exactApi};
const modelChoiceBase={
 tenantId,
 portalRecord:{tenantId,data:{portal:{aiModelPreferences:{
  schemaVersion:2,requestState:'review_only_not_activated',
  models:[{modelId:selectedModel,routeId:'mistral-api-eu'}],
  assignments:{brain:selectedModel},policy:'review'
 }}}},
 sovereigntyPolicy:{mode:'TRANSPARENT_GLOBAL'},
 registryRecord:{signedProof:{receipt:{tenantId,useCaseId:'portal-project-answer',provider:'MISTRAL_API',modelId:exactApi}}},
 catalog:{models:[catalogModel]},
 supplierStatus:{records:{[selectedModel]:'VERIFIED'}}
};

test('saved tenant Brain assignment binds exactly to separately attested provider/model/route',()=>{
 const yes=evaluateTenantModelChoice(modelChoiceBase);
 assert.equal(yes.ok,true);
 assert.equal(yes.modelId,selectedModel);
 for(const [patch,expected] of [
  [{supplierStatus:{records:{[selectedModel]:'PARTIAL'}}},'SUPPLIER_CLAIMS_UNRESOLVED'],
  [{supplierStatus:{records:{[selectedModel]:'CONFLICT'}}},'SUPPLIER_CLAIMS_UNRESOLVED'],
  [{portalRecord:{tenantId:'other',data:modelChoiceBase.portalRecord.data}},'TENANT_PORTAL_STATE_REQUIRED'],
  [{portalRecord:{tenantId,data:{portal:{aiModelPreferences:{...modelChoiceBase.portalRecord.data.portal.aiModelPreferences,assignments:{}}}}}},'BRAIN_MODEL_NOT_ASSIGNED'],
  [{registryRecord:{signedProof:{receipt:{tenantId,provider:'MISTRAL_API',useCaseId:'portal-project-answer',modelId:'another-model'}}}},'SIGNED_PROVIDER_MODEL_MISMATCH'],
  [{portalRecord:{tenantId,data:{portal:{aiModelPreferences:{...modelChoiceBase.portalRecord.data.portal.aiModelPreferences,models:[{modelId:selectedModel,routeId:'mistral-selfhost'}]}}}}},'DEPLOYMENT_ROUTE_NOT_ATTESTED'],
  [{catalog:{models:[{...catalogModel,status:'deprecated'}]}},'MODEL_LIFECYCLE_NOT_ACTIVE'],
  [{catalog:{models:[{...catalogModel,provider_api_id:null}]}},'MODEL_API_ID_NOT_VERIFIED']
 ]){
  const got=evaluateTenantModelChoice({...modelChoiceBase,...patch});
  assert.equal(got.ok,false,expected);
  assert.equal(got.code,expected);
 }
});

test('a preferred EEA storage and inference location cannot be faked by customer preferences',()=>{
 const set=(policy,mode)=>evaluateTenantModelChoice({...modelChoiceBase,
  portalRecord:{tenantId,data:{portal:{aiModelPreferences:{
   ...modelChoiceBase.portalRecord.data.portal.aiModelPreferences,policy
  }}}},sovereigntyPolicy:{mode}});
 assert.equal(set('eu-both','TRANSPARENT_GLOBAL').code,'EU_PROCESSING_REQUIREMENT_NOT_ENFORCED');
 assert.equal(set('eu-storage','TRANSPARENT_GLOBAL').code,'EU_STORAGE_REQUIREMENT_NOT_ENFORCED');
 assert.equal(set('strict','EU_ONLY').code,'CUSTOMER_CONTROLLED_RUNTIME_REQUIRED');
 assert.equal(set('eu-both','EU_ONLY').ok,true);
});

test('tenant inference route never calls provider when model preference gate is blocked or unavailable',async()=>{
 let egress=0,checked=0;
 const common={request:req({question:'Do not send'}),user,tenantId,sovereignty,registry,proofKey:key,now,
  fetchFn:async()=>{egress++;throw Error('UNAUTHORIZED_PROVIDER_EGRESS')}};
 const mismatch=await handleTenantAiInference({...common,choiceGuard:async({tenantId:t,registryRecord,sovereigntyPolicy})=>{
  checked++;assert.equal(t,tenantId);assert.ok(registryRecord.signedProof);assert.ok(sovereigntyPolicy.ai_deployment_profile);
  return {ok:false,code:'SUPPLIER_CLAIMS_UNRESOLVED'};
 }});
 assert.equal(mismatch.status,409);
 assert.deepEqual(await mismatch.json(),{error:'MODEL_CHOICE_NOT_ACTIVATED',reason:'SUPPLIER_CLAIMS_UNRESOLVED'});
 const absent=await handleTenantAiInference({...common,choiceGuard:async()=>{throw Error('STORE_DOWN')}});
 assert.equal(absent.status,503);
 assert.deepEqual(await absent.json(),{error:'MODEL_CHOICE_READBACK_UNAVAILABLE'});
 assert.equal(checked,1);
 assert.equal(egress,0);
});

test('one selected default model is inherited by Brain without adding an override',()=>{
 const prefs={...modelChoiceBase.portalRecord.data.portal.aiModelPreferences,
  defaultModelId:selectedModel,assignments:{}};
 const chosen=resolveDesiredTenantModel(prefs,'brain');
 assert.deepEqual(chosen,{ok:true,modelId:selectedModel,routeId:'mistral-api-eu',source:'default',workload:'brain'});
 const result=evaluateTenantModelChoice({...modelChoiceBase,
  portalRecord:{tenantId,data:{portal:{aiModelPreferences:prefs}}}});
 assert.equal(result.ok,true);
 assert.equal(result.selectionSource,'default');
});

test('explicit workload override takes priority; absent route or unsafe supplier remains blocked',()=>{
 const prefs={...modelChoiceBase.portalRecord.data.portal.aiModelPreferences,
  defaultModelId:'gpt-6-sol',assignments:{brain:selectedModel}};
 const model=resolveDesiredTenantModel(prefs,'brain');
 assert.equal(model.modelId,selectedModel);
 assert.equal(model.source,'override');
 const chosen=evaluateTenantModelChoice({...modelChoiceBase,
  portalRecord:{tenantId,data:{portal:{aiModelPreferences:prefs}}}});
 assert.equal(chosen.ok,true);
 const partial=evaluateTenantModelChoice({...modelChoiceBase,
  portalRecord:{tenantId,data:{portal:{aiModelPreferences:{...prefs,assignments:{},defaultModelId:selectedModel}}}},
  supplierStatus:{records:{[selectedModel]:'PARTIAL'}}});
 assert.equal(partial.ok,false);
 assert.equal(partial.code,'SUPPLIER_CLAIMS_UNRESOLVED');
 const missing=evaluateTenantModelChoice({...modelChoiceBase,
  portalRecord:{tenantId,data:{portal:{aiModelPreferences:{...prefs,models:[]}}}}});
 assert.equal(missing.ok,false);
 assert.equal(missing.code,'MODEL_NOT_IN_TENANT_WISHLIST');
});

test('unknown workload and specialist tasks cannot inherit accidental provider execution',async()=>{
 const prefs=modelChoiceBase.portalRecord.data.portal.aiModelPreferences;
 assert.equal(resolveDesiredTenantModel(prefs,'invented').code,'UNKNOWN_MODEL_WORKLOAD');
 assert.equal(resolveDesiredTenantModel({...prefs,defaultModelId:selectedModel},'documents').modelId,selectedModel);
 // Document OCR is desired state only: actual attested hosted gateway is locked to portal-project-answer.
 assert.equal(String((await import('../platform/api/tenant-ai-inference-handler.mjs')).handleTenantAiInference).includes('portal-project-answer'),true);
});

test('only server-provided tenant context is attached to signed provider request',async()=>{
 let calls=0;
 const res=await handleTenantAiInference({
  request:req({question:'Welke naam staat geregistreerd?'}),
  user,tenantId,sovereignty,registry,proofKey:key,now,
  trustedServerContext:JSON.stringify({company:{name:'Trusted BV'},forecast:{status:'insufficient evidence'}}),
  fetchFn:async(url,options)=>{
    calls++;assert.equal(url,'https://api.mistral.ai/v1/chat/completions');
    const body=JSON.parse(options.body);
    assert.equal(body.messages[0].role,'system');
    assert.match(body.messages[0].content,/untrusted DATA/);
    assert.match(body.messages[1].content,/Trusted BV/);
    assert.match(body.messages[1].content,/Welke naam/);
    return {ok:true,status:200,json:async()=>({choices:[{message:{content:'Trusted BV'}}]})};
  }
 });
 assert.equal(res.status,200);
 assert.equal((await res.json()).answer,'Trusted BV');
 assert.equal(calls,1);
});

test('browser-controlled context cannot enter attested provider request',async()=>{
 let calls=0;
 const payload={question:'Maak prognose',context:{revenue:'FAKE'},model:'gpt-6-sol'};
 const res=await handleTenantAiInference({
  request:req(payload),user,tenantId,sovereignty,registry,proofKey:key,now,
  fetchFn:async()=>{calls++;throw Error('NO_EGRESS')}
 });
 assert.equal(res.status,422);
 assert.equal(calls,0);
});

test('invalid trusted context never reaches the provider',async()=>{
 let calls=0;
 for(const trustedServerContext of ['x','y'.repeat(9001)]){
  const res=await handleTenantAiInference({
   request:req({question:'Hello'}),user,tenantId,sovereignty,registry,proofKey:key,now,
   trustedServerContext,fetchFn:async()=>{calls++;throw Error('NO_EGRESS')}
  });
  assert.equal(res.status,503);
  assert.equal((await res.json()).error,'INVALID_TRUSTED_TENANT_CONTEXT');
 }
 assert.equal(calls,0);
});
