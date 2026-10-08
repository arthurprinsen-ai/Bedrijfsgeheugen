import test from 'node:test';
import assert from 'node:assert/strict';
import {signVerifiedRuntimeProof,verifySignedRuntimeProof,runAttestedTenantChat} from '../platform/runtime/attested-cloud-ai.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';
const key='test-server-only-key-0123456789abcdef0123456789';
const now=1_000_000;
const tenantId='tenant-a',useCaseId='customer-portal-qa',policyVersion=4;
const profile={...CURRENT_AI_DEPLOYMENT_PROFILE,provider:'MISTRAL_API',modelFamily:'MISTRAL',modelId:'mistral-small-latest'};
const proof=(patch={})=>({...profile,tenantId,useCaseId,policyVersion,endpointId:'mistral-approved',
  evidenceId:'model-readback-verified-009',providerReadbackEvidenceId:'provider-readback-verified-009',
  residencyEvidenceId:'residency-check-verified-009',dataProcessingEvidenceId:'dpa-audited-verified-009',
  egressEvidenceId:'egress-proof-verified-009',status:'VERIFIED',verifier:'PROVIDER_READBACK',proofStatus:'ATTESTED',
  revoked:false,verifiedAt:now-20000,issuedAt:now-10000,validUntil:now+500000,...patch});
const sign=r=>signVerifiedRuntimeProof({receipt:r,key});
const request={messages:[{role:'system',content:'Answer from approved context only.'},{role:'user',content:'Summarize'}],maxTokens:120};
const config={MISTRAL_API:{apiKey:'fake-provider-key',endpointId:'mistral-approved',
  providerReadbackEvidenceId:'provider-readback-verified-009',egressEvidenceId:'egress-proof-verified-009'}};
const args={tenantId,useCaseId,profile,policyVersion,key,request,config,now};
const result={ok:true,status:200,json:async()=>({choices:[{message:{content:'Grounded answer'}}],usage:{prompt_tokens:6,completion_tokens:3}})};
test('signed tenant- and use-case-bound Mistral route uses only exact approved host with no fallback',async()=>{
 let calls=0;
 const answer=await runAttestedTenantChat({...args,signedProof:sign(proof()),fetchFn:async(url,init)=>{
  calls++;assert.equal(url,'https://api.mistral.ai/v1/chat/completions');
  assert.equal(init.headers.authorization,'Bearer fake-provider-key');
  assert.equal(JSON.parse(init.body).model,'mistral-small-latest');
  return result;
 }});
 assert.equal(calls,1);assert.equal(answer.text,'Grounded answer');
 assert.equal(answer.provenance.tenantId,tenantId);
 assert.equal(answer.provenance.provider,'MISTRAL_API');
 assert.equal(answer.provenance.providerReadbackEvidenceId,'provider-readback-verified-009');
});
test('signature tampering, wrong tenant, wrong use case, stale policy and revoked proof all stop before egress',async()=>{
 const good=sign(proof());let calls=0;const fetchFn=async()=>{calls++;return result};
 const variants=[
  {...args,signedProof:{...good,receipt:{...good.receipt,provider:'AZURE_OPENAI'}}},
  {...args,signedProof:good,tenantId:'tenant-b'},
  {...args,signedProof:good,useCaseId:'other-purpose'},
  {...args,signedProof:good,policyVersion:5},
  {...args,signedProof:sign(proof({revoked:true}))},
  {...args,signedProof:sign(proof({validUntil:now}))},
  {...args,signedProof:sign(proof({providerReadbackEvidenceId:''}))}
 ];
 for(const item of variants)await assert.rejects(runAttestedTenantChat({...item,fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,0);
});
test('runtime refuses missing/changed server-side evidence and private/offline cloud egress',async()=>{
 let calls=0;const fetchFn=async()=>{calls++;return result};
 await assert.rejects(runAttestedTenantChat({...args,signedProof:sign(proof()),
  config:{MISTRAL_API:{...config.MISTRAL_API,egressEvidenceId:'old-egress-evidence'}},fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 const local={...CURRENT_AI_DEPLOYMENT_PROFILE,deploymentMode:'AIR_GAPPED',provider:'OLLAMA',
  modelFamily:'MISTRAL',computeRegion:'LOCAL',storageRegion:'LOCAL',ragRegion:'LOCAL',networkMode:'OFFLINE'};
 await assert.rejects(runAttestedTenantChat({...args,profile:local,signedProof:sign({...proof(),...local}),fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 const pinned={...profile,computeRegion:'EU'};
 await assert.rejects(runAttestedTenantChat({...args,profile:pinned,signedProof:sign({...proof(),...pinned}),fetchFn}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,0);
});
test('Azure API host and deployment are fixed by trusted server config and region binding',async()=>{
 const azure={...CURRENT_AI_DEPLOYMENT_PROFILE,provider:'AZURE_OPENAI',modelFamily:'CUSTOM',
  modelId:'gpt-4o',computeRegion:'EU',storageRegion:'EU',ragRegion:'EU'};
 const azureReceipt={...proof(),...azure,endpointId:'verified-deployment'};
 let calls=0;const answer=await runAttestedTenantChat({
  ...args,profile:azure,signedProof:sign(azureReceipt),
  config:{AZURE_OPENAI:{apiKey:'azure-key',resourceName:'tenant-approved-west',
    deploymentId:'verified-deployment',endpointId:'verified-deployment',
    apiVersion:'2024-10-21',processingRegion:'EU',
    providerReadbackEvidenceId:'provider-readback-verified-009',egressEvidenceId:'egress-proof-verified-009'}},
  fetchFn:async(url,init)=>{
   calls++;assert.equal(url,'https://tenant-approved-west.openai.azure.com/openai/deployments/verified-deployment/chat/completions?api-version=2024-10-21');
   assert.equal(init.headers['api-key'],'azure-key');return result;
  }
 });
 assert.equal(calls,1);assert.equal(answer.provenance.provider,'AZURE_OPENAI');
});
test('no retry or cross-provider fallback on provider failure',async()=>{
 let calls=0;
 await assert.rejects(runAttestedTenantChat({...args,signedProof:sign(proof()),fetchFn:async()=>{
   calls++;return {ok:false,status:503,json:async()=>({error:{message:'sensitive'}})};
 }}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,1);
});
test('request bounds and signing key strength are enforced',async()=>{
 assert.throws(()=>signVerifiedRuntimeProof({receipt:proof(),key:'weak'}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 let calls=0;
 await assert.rejects(runAttestedTenantChat({...args,signedProof:sign(proof()),
  request:{messages:[{role:'user',content:'a'.repeat(25000)}],maxTokens:150},fetchFn:async()=>{calls++;return result;}}),{code:'AI_RUNTIME_NOT_VERIFIED'});
 assert.equal(calls,0);
 const claim=verifySignedRuntimeProof({...args,signed:sign(proof())});
 assert.equal(claim.tenantId,tenantId);
});
