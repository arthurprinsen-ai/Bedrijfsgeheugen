import test from 'node:test';
import assert from 'node:assert/strict';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';
import {signLocalRuntimeProof,verifyLocalRuntimeProof,runVerifiedLocalChat} from '../platform/runtime/attested-local-ai.mjs';

const key='server-owned-local-attestation-key-0123456789abcdef';
const now=1_000_000,tenantId='tenant-a',useCaseId='tenant-rag',policyVersion=7;
const digest='a'.repeat(64);
const profile={...CURRENT_AI_DEPLOYMENT_PROFILE,deploymentMode:'ON_PREMISE',provider:'OLLAMA',modelFamily:'MISTRAL',
 computeRegion:'LOCAL',storageRegion:'LOCAL',ragRegion:'LOCAL',modelId:'mistral:7b'};
const receipt=(p=profile,patch={})=>({...p,tenantId,useCaseId,policyVersion,status:'VERIFIED',verifier:'LOCAL_AGENT_READBACK',
 proofStatus:'ATTESTED',endpointId:'local-mistral',evidenceId:'local-model-verified',
 modelDigest:digest,modelReadbackEvidenceId:'model-readback-verified',
 networkIsolationEvidenceId:'firewall-verified',storageAndRagEvidenceId:'rag-local-verified',
 healthEvidenceId:'health-verified',changeId:'sovereignty:tenant-a:7',
 customerConsentId:'consent-local-7',verifiedAt:now-20000,issuedAt:now-10000,validUntil:now+200000,
 revoked:false,offlineSystemAttested:false,...patch});
const approval=(patch={})=>({tenantId,changeId:'sovereignty:tenant-a:7',policyVersion,status:'CLEARED',customerConsentId:'consent-local-7',
 validUntil:now+100000,evidenceIds:['local-model-verified'],approvedScopes:['privacy','security','ai_governance','data_residency','supplier_risk','finance','sustainability','csrd_esrs_scope','audit','customer_disclosure'],...patch});
const endpoint=(p=profile,patch={})=>({tenantId,endpointId:'local-mistral',provider:p.provider,networkMode:p.networkMode,
 region:'LOCAL',host:'127.0.0.1',port:p.provider==='OLLAMA'?11434:8000,modelId:p.modelId,modelDigest:digest,
 localOnly:true,enabled:true,networkIsolationEvidenceId:'firewall-verified',
 storageAndRagEvidenceId:'rag-local-verified',healthEvidenceId:'health-verified',...patch});
const request={messages:[{role:'user',content:'Explain document'}],maxTokens:80};
const args=(p=profile,r=receipt(p),a=approval(),e=endpoint(p))=>({tenantId,useCaseId,policyVersion,
 profile:p,request,key,now,localOperatorAttestation:'ISOLATED_LOCAL_EXECUTOR',
 loadSignedLocalProof:async()=>signLocalRuntimeProof({receipt:r,key}),
 loadCrossDomainApproval:async()=>a,endpointRegistry:new Map([[e.endpointId,e]])});
const response={ok:true,status:200,json:async()=>({message:{content:'Local answer'},prompt_eval_count:10,eval_count:8})};

test('Ollama only uses numeric loopback with model pinning and approved CSRD change',async()=>{
 let calls=0;
 const result=await runVerifiedLocalChat({...args(),fetchFn:async(url,opts)=>{
  calls++;assert.equal(url,'http://127.0.0.1:11434/api/chat');
  assert.equal(opts.redirect,'error');
  assert.equal(JSON.parse(opts.body).model,'mistral:7b');
  assert.equal(JSON.parse(opts.body).stream,false);
  return response;
 }});
 assert.equal(calls,1);assert.equal(result.text,'Local answer');
 assert.equal(result.provenance.modelDigest,digest);
 assert.equal(result.provenance.tenantId,tenantId);
});
test('vLLM uses only registered loopback endpoint, with no external URL configuration',async()=>{
 const p={...profile,provider:'VLLM',modelFamily:'CUSTOM',modelId:'custom/llama-8b'};
 let calls=0;
 const result=await runVerifiedLocalChat({...args(p),fetchFn:async(url,opts)=>{
  calls++;assert.equal(url,'http://127.0.0.1:8000/v1/chat/completions');
  assert.equal(JSON.parse(opts.body).model,'custom/llama-8b');
  return {ok:true,json:async()=>({choices:[{message:{content:'Local vLLM answer'}}]})};
 }});
 assert.equal(calls,1);assert.equal(result.text,'Local vLLM answer');
});
test('customer, signature, stale version and evidence mismatches prevent any local inference',async()=>{
 let count=0;const fetchFn=async()=>{count++;return response};
 const a=args(),signed=await a.loadSignedLocalProof();
 for(const changed of [
  {...args(),tenantId:'other-tenant'},
  {...args(),useCaseId:'another-purpose'},
  {...args(),policyVersion:8},
  {...args(),loadSignedLocalProof:async()=>({...signed,receipt:{...signed.receipt,modelDigest:'b'.repeat(64)}})},
  args(profile,receipt(profile,{revoked:true})),
  args(profile,receipt(profile,{validUntil:now})),
  args(profile,receipt(profile,{networkIsolationEvidenceId:''})),
  args(profile,receipt(profile,{modelDigest:'not-a-digest'})),
  args(profile,receipt(profile,{modelId:'another-model'})),
  args(profile,receipt(profile,{customerConsentId:'other-consent'})),
  args(profile,receipt(profile,{changeId:'other-change'})),
  args(profile,receipt(profile,{offlineSystemAttested:false}),approval({status:'PENDING_EVIDENCE'})),
  args(profile,receipt(),approval({approvedScopes:approval().approvedScopes.filter(x=>x!=='csrd_esrs_scope')})),
  args(profile,receipt(),approval({validUntil:now-1})),
  args(profile,receipt(),endpoint(profile,{host:'example.com'})),
  args(profile,receipt(),endpoint(profile,{port:99999})),
  args(profile,receipt(),endpoint(profile,{modelDigest:'b'.repeat(64)})),
  args(profile,receipt(),endpoint(profile,{networkIsolationEvidenceId:'different-firewall-proof'})),
  {...args(),localOperatorAttestation:'HOSTED_CLOUD'},
  {...args(),endpointRegistry:new Map()}
 ])await assert.rejects(runVerifiedLocalChat({...changed,fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(count,0);
});
test('air-gapped route demands explicit offline local-agent attestation before execution',async()=>{
 const p={...profile,deploymentMode:'AIR_GAPPED',networkMode:'OFFLINE'};
 let calls=0;const fetchFn=async()=>{calls++;return response};
 await assert.rejects(runVerifiedLocalChat({...args(p,receipt(p,{offlineSystemAttested:false})),fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 const result=await runVerifiedLocalChat({...args(p,receipt(p,{offlineSystemAttested:true})),fetchFn});
 assert.equal(result.text,'Local answer');assert.equal(calls,1);
});
test('local adapter never retries or falls back on failure, and rejects unsafe request',async()=>{
 let count=0;
 await assert.rejects(runVerifiedLocalChat({...args(),fetchFn:async()=>{count++;return {ok:false,status:503,json:async()=>({})};}}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(count,1);
 await assert.rejects(runVerifiedLocalChat({...args(),request:{messages:[{role:'user',content:'x'.repeat(25000)}],maxTokens:5},fetchFn:async()=>{count++;return response}}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(count,1);
});
test('short signing keys and unverifiable endpoint evidence are rejected',()=>{
 assert.throws(()=>signLocalRuntimeProof({receipt:receipt(),key:'short'}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.throws(()=>verifyLocalRuntimeProof({signed:signLocalRuntimeProof({receipt:receipt(),key}),key,tenantId,useCaseId,policyVersion:1,profile,now}),{code:'AI_RUNTIME_NOT_VERIFIED'});
});
