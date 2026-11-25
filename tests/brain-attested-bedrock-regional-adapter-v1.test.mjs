import test from 'node:test';
import assert from 'node:assert/strict';
import {createAttestedBedrockAdapter} from '../platform/runtime/attested-bedrock-adapter.mjs';
import {runAttestedTenantChat,signVerifiedRuntimeProof} from '../platform/runtime/attested-cloud-ai.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';

const now=Date.parse('2026-10-08T17:00:00Z');
const tenantId='tenant-a',useCaseId='portal-project-answer',policyVersion=3;
const key='test-server-only-key-0123456789abcdef0123456789';
const modelId='mistral.mistral-large-2407-v1:0';
const profile={...CURRENT_AI_DEPLOYMENT_PROFILE,provider:'AWS_BEDROCK',modelFamily:'MISTRAL',
 modelId,computeRegion:'EU',storageRegion:'EU',ragRegion:'EU'};
const config={endpointId:'bedrock-eu-approved',awsRegion:'eu-central-1',
 modelReadbackRegion:'eu-central-1',processingRegion:'EU',modelId,
 accessKeyId:'ASIA'+'A'.repeat(16),secretAccessKey:'fake-secret-access-key-for-tests-only-12345',
 sessionToken:'ephemeral-session-token-for-tests',credentialsExpireAt:now+60_000,
 providerReadbackEvidenceId:'bedrock-provider-readback-001',egressEvidenceId:'bedrock-egress-proof-001',
 residencyEvidenceId:'bedrock-residency-proof-001'};
const route={provider:'AWS_BEDROCK',modelId,endpointId:config.endpointId,region:'EU',networkMode:'STANDARD'};
const request={messages:[{role:'system',content:'Use approved data only.'},
 {role:'user',content:'Say hello.'}],maxTokens:120};
const response={ok:true,status:200,json:async()=>({output:{message:{role:'assistant',content:[{text:'Hello from Bedrock.'}]}},
 stopReason:'end_turn',usage:{inputTokens:7,outputTokens:4}})};
const receipt={...profile,tenantId,useCaseId,policyVersion,endpointId:config.endpointId,awsRegion:config.awsRegion,
 evidenceId:'bedrock-inference-proof-001',providerReadbackEvidenceId:config.providerReadbackEvidenceId,
 residencyEvidenceId:config.residencyEvidenceId,egressEvidenceId:config.egressEvidenceId,
 dataProcessingEvidenceId:'bedrock-dpa-verified-001',
 status:'VERIFIED',verifier:'PROVIDER_READBACK',proofStatus:'ATTESTED',revoked:false,
 verifiedAt:now-20000,issuedAt:now-10000,validUntil:now+300000,
 changeId:'sovereignty:tenant-a:3',customerConsentId:'bedrock-consent-3'};
const signedProof=signVerifiedRuntimeProof({receipt,key});
const approvedScopes=['privacy','security','ai_governance','data_residency','supplier_risk',
 'finance','sustainability','csrd_esrs_scope','audit','customer_disclosure'];
const approval={tenantId,changeId:receipt.changeId,policyVersion,status:'CLEARED',
 customerConsentId:receipt.customerConsentId,approvedScopes,evidenceIds:[receipt.evidenceId],
 validUntil:now+240000};
const registeredEndpoints=[{tenantId,provider:'AWS_BEDROCK',endpointId:config.endpointId,
 region:'EU',networkMode:'STANDARD',enabled:true}];
const base={tenantId,useCaseId,profile,policyVersion,signedProof,key,request,
 config:{AWS_BEDROCK:config},approval,registeredEndpoints,now};
const deny=async p=>assert.rejects(p,{code:'AI_RUNTIME_NOT_VERIFIED'});

test('AWS regional Converse request is SigV4-signed and model/host pinned',async()=>{
 let calls=0;
 const adapter=createAttestedBedrockAdapter({config,now,fetchFn:async(url,init)=>{
  calls++;
  assert.equal(url,'https://bedrock-runtime.eu-central-1.amazonaws.com/model/mistral.mistral-large-2407-v1%3A0/converse');
  assert.equal(init.method,'POST');
  assert.equal(init.redirect,'error');
  assert.match(init.headers.authorization,/^AWS4-HMAC-SHA256 Credential=ASIA/);
  assert.ok(init.headers.authorization.includes('/20261008/eu-central-1/bedrock/aws4_request,'));
  assert.equal(init.headers['x-amz-date'],'20261008T170000Z');
  assert.equal(init.headers['x-amz-security-token'],config.sessionToken);
  const body=JSON.parse(init.body);
  assert.equal(body.messages[0].role,'user');
  assert.equal(body.messages[0].content[0].text,'Say hello.');
  assert.equal(body.system[0].text,'Use approved data only.');
  assert.equal(body.inferenceConfig.maxTokens,120);
  return response;
 }});
 const result=await adapter({route,request});
 assert.equal(calls,1);
 assert.equal(result.text,'Hello from Bedrock.');
 assert.equal(result.providerUsage.inputTokens,7);
});

test('bad region, model, temporary AWS session, network policy or evidence deny egress',async()=>{
 let calls=0;
 const fetchFn=async()=>{calls++;throw Error('unexpected provider egress')};
 for(const [c,p] of [
  [{...config,awsRegion:'eu-north-1'},route],
  [{...config,modelReadbackRegion:'eu-west-1'},route],
  [{...config,credentialsExpireAt:now+1000},route],
  [{...config,accessKeyId:'AKIA'+'A'.repeat(16)},route],
  [{...config,sessionToken:''},route],
  [{...config,residencyEvidenceId:''},route],
  [config,{...route,modelId:'eu.anthropic.claude-3-sonnet'}],
  [config,{...route,region:'US'}],
  [config,{...route,networkMode:'PRIVATE_ENDPOINT'}]
 ]){
  await deny(createAttestedBedrockAdapter({config:c,fetchFn,now})({route:p,request}));
 }
 assert.equal(calls,0);
});

test('exact signed tenant and governance proof permits one Bedrock invocation',async()=>{
 let calls=0;
 const result=await runAttestedTenantChat({...base,fetchFn:async()=>{
  calls++;return response;
 }});
 assert.equal(calls,1);
 assert.equal(result.text,'Hello from Bedrock.');
 assert.equal(result.provenance.provider,'AWS_BEDROCK');
 assert.equal(result.provenance.tenantId,tenantId);
});

test('tampered regional receipt, missing approval and wrong endpoint deny before egress',async()=>{
 let calls=0;
 const fetchFn=async()=>{calls++;throw Error('unexpected provider egress')};
 for(const overrides of [
  {signedProof:{...signedProof,receipt:{...receipt,awsRegion:'us-east-1'}}},
  {signedProof:signVerifiedRuntimeProof({receipt:{...receipt,awsRegion:'us-east-1'},key})},
  {config:{AWS_BEDROCK:{...config,awsRegion:'eu-west-1'}}},
  {approval:null},
  {approval:{...approval,status:'REVIEW_REQUIRED'}},
  {registeredEndpoints:[]},
  {profile:{...profile,computeRegion:'US'}}
 ]){
  await deny(runAttestedTenantChat({...base,...overrides,fetchFn}));
 }
 assert.equal(calls,0);
});

test('provider failure does not retry or route to another provider',async()=>{
 let calls=0;
 await deny(runAttestedTenantChat({...base,fetchFn:async()=>{
  calls++;return {ok:false,status:503,json:async()=>({error:'secret'})};
 }}));
 assert.equal(calls,1);
});

test('malformed, blocked, or empty Converse responses are denied',async()=>{
 let calls=0;
 for(const body of [
  {stopReason:'guardrail_intervened',output:{message:{role:'assistant',content:[{text:'filtered'}]}}},
  {stopReason:'end_turn',output:{message:{role:'assistant',content:[]}}},
  {stopReason:'end_turn',output:{message:{role:'assistant',content:[{toolUse:{name:'tool'}}]}}}
 ]){
  const adapter=createAttestedBedrockAdapter({config,now,fetchFn:async()=>{
   calls++;return {ok:true,status:200,json:async()=>body};
  }});
  await deny(adapter({route,request}));
 }
 assert.equal(calls,3);
});
