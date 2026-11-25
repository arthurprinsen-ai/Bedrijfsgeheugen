import test from 'node:test';
import assert from 'node:assert/strict';
import {runAttestedTenantChat,signVerifiedRuntimeProof} from '../platform/runtime/attested-cloud-ai.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';

const now=1_000_000,key='vertex-signing-key-0123456789abcdef0123456789',tenantId='tenant-vertex';
const profile={...CURRENT_AI_DEPLOYMENT_PROFILE,provider:'GOOGLE_VERTEX',modelFamily:'CUSTOM',
 modelId:'gemini-2.5-flash',computeRegion:'EU',storageRegion:'EU',ragRegion:'EU'};
const receipt={...profile,tenantId,useCaseId:'portal-project-answer',policyVersion:4,
 endpointId:'vertex-eu-approved',evidenceId:'verified-provider-proof-v1',
 providerReadbackEvidenceId:'provider-readback-vertex-eu-v1',
 residencyEvidenceId:'residency-vertex-eu-v1',dataProcessingEvidenceId:'dpa-vertex-eu-v1',
 egressEvidenceId:'egress-vertex-eu-v1',changeId:'sovereignty:tenant-vertex:4',
 customerConsentId:'consent-vertex-eu-v1',status:'VERIFIED',
 verifier:'PROVIDER_READBACK',proofStatus:'ATTESTED',revoked:false,
 verifiedAt:now-20000,issuedAt:now-12000,validUntil:now+120000};
const approvedScopes=['privacy','security','ai_governance','data_residency','supplier_risk','finance','sustainability','csrd_esrs_scope','audit','customer_disclosure'];
const approval={tenantId,changeId:receipt.changeId,policyVersion:4,status:'CLEARED',
 customerConsentId:receipt.customerConsentId,validUntil:now+100000,approvedScopes,
 evidenceIds:[receipt.evidenceId]};
const endpoint={endpointId:receipt.endpointId,tenantId,provider:'GOOGLE_VERTEX',
 networkMode:'STANDARD',region:'EU',enabled:true};
const config={GOOGLE_VERTEX:{projectId:'example-tenant123',location:'europe-west4',
 processingRegion:'EU',modelId:profile.modelId,accessToken:'server-oauth-token',
 endpointId:receipt.endpointId,providerReadbackEvidenceId:receipt.providerReadbackEvidenceId,
 egressEvidenceId:receipt.egressEvidenceId}};
const request={messages:[{role:'system',content:'Only answer using provided context'},
 {role:'user',content:'Question for this tenant'}],maxTokens:180};
const base={tenantId,useCaseId:receipt.useCaseId,profile,policyVersion:4,
 signedProof:signVerifiedRuntimeProof({receipt,key}),key,request,config,approval,
 registeredEndpoints:[endpoint],now};

test('attested regional Google Vertex transports only the approved tenant model',async()=>{
 let calls=0;
 const result=await runAttestedTenantChat({...base,fetchFn:async(url,init)=>{
  calls++;
  assert.equal(url,'https://europe-west4-aiplatform.googleapis.com/v1/projects/example-tenant123/locations/europe-west4/publishers/google/models/gemini-2.5-flash:generateContent');
  assert.equal(init.method,'POST');
  assert.equal(init.redirect,'error');
  assert.equal(init.headers.authorization,'Bearer server-oauth-token');
  const body=JSON.parse(init.body);
  assert.deepEqual(body.contents,[{role:'user',parts:[{text:'Question for this tenant'}]}]);
  assert.equal(body.systemInstruction.parts[0].text,'Only answer using provided context');
  assert.equal(body.generationConfig.maxOutputTokens,180);
  return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Vertex verified output'}]}}],usageMetadata:{promptTokenCount:15}})};
 }});
 assert.equal(calls,1);
 assert.equal(result.text,'Vertex verified output');
 assert.equal(result.provenance.provider,'GOOGLE_VERTEX');
 assert.equal(result.provenance.tenantId,tenantId);
});

test('invalid region, global endpoint, model or OAuth evidence fails before external egress',async()=>{
 let calls=0;
 const fetchFn=async()=>{calls++;throw Error('MUST_NOT_EGRESS')};
 const invalid=[
  {...config.GOOGLE_VERTEX,location:'us-central1'},
  {...config.GOOGLE_VERTEX,location:'global'},
  {...config.GOOGLE_VERTEX,location:'europe-west4.attacker.test'},
  {...config.GOOGLE_VERTEX,projectId:'evil.example.com'},
  {...config.GOOGLE_VERTEX,modelId:'gemini-2.5-pro'},
  {...config.GOOGLE_VERTEX,accessToken:''},
  {...config.GOOGLE_VERTEX,providerReadbackEvidenceId:''},
  {...config.GOOGLE_VERTEX,processingRegion:'US'}
 ];
 for(const item of invalid)
  await assert.rejects(runAttestedTenantChat({...base,config:{GOOGLE_VERTEX:item},fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,0);
});

test('no cross-provider fallback on HTTP failure, safety block, or missing CSRD clearance',async()=>{
 let calls=0;
 const fetchFn=async()=>{calls++;return {ok:false,status:503,json:async()=>({error:{message:'sensitive'}})};};
 await assert.rejects(runAttestedTenantChat({...base,fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,1);
 const badSafety=await assert.rejects(runAttestedTenantChat({...base,fetchFn:async()=>{
  calls++;return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'SAFETY',content:{parts:[]}}]})};
 }}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,2);
 await assert.rejects(runAttestedTenantChat({...base,approval:{...approval,status:'REVIEW_REQUIRED'},fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,2);
});
