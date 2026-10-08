import {createHmac,timingSafeEqual} from 'node:crypto';
import {invokeVerifiedAiRuntime,AiRuntimeDenied} from '../brain/verified-ai-runtime.mjs';
import {validateCustomerAiDeployment} from '../policy/customer-ai-deployment.mjs';

// Private server-side contract. Signing is reserved for an independently verified,
// audited provisioning/readback authority; the customer configuration is never a proof.
const SCHEMA='powerhouse-signed-runtime-proof-v1';
const stable=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const reject=code=>{throw new AiRuntimeDenied(code)};
const secretKey=key=>{
 if(typeof key!=='string'||Buffer.byteLength(key,'utf8')<32)reject('RUNTIME_PROOF_KEY_NOT_CONFIGURED');
 return key;
};
const digest=(receipt,key)=>createHmac('sha256',secretKey(key)).update(SCHEMA+'\n'+stable(receipt),'utf8').digest();
const hexSignature=sig=>typeof sig==='string'&&/^[0-9a-f]{64}$/i.test(sig)?Buffer.from(sig,'hex'):null;
const exact=(v,opts)=>typeof v==='string'&&opts.includes(v);
const verifyClock=(v,now)=>Number.isSafeInteger(v)&&v>0&&v<=now;
const policyProofKeys=['providerReadbackEvidenceId','residencyEvidenceId','dataProcessingEvidenceId','egressEvidenceId'];
export function signVerifiedRuntimeProof({receipt,key}={}){
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))reject('INVALID_RUNTIME_PROOF');
 return Object.freeze({schema:SCHEMA,receipt,signature:digest(receipt,key).toString('hex')});
}
export function verifySignedRuntimeProof({signed,key,tenantId,useCaseId,policyVersion,profile,now=Date.now()}={}){
 if(!signed||signed.schema!==SCHEMA||!signed.receipt||!Number.isSafeInteger(now))reject('INVALID_RUNTIME_PROOF');
 const incoming=hexSignature(signed.signature);
 if(!incoming||!timingSafeEqual(incoming,digest(signed.receipt,key)))reject('RUNTIME_PROOF_SIGNATURE_INVALID');
 const claim=signed.receipt;
 if(!tenantId||claim.tenantId!==tenantId||!useCaseId||claim.useCaseId!==useCaseId)
  reject('RUNTIME_PROOF_TENANT_OR_PURPOSE_MISMATCH');
 if(!Number.isSafeInteger(policyVersion)||policyVersion<1||claim.policyVersion!==policyVersion)
  reject('RUNTIME_PROOF_POLICY_STALE');
 if(claim.verifier!=='PROVIDER_READBACK'||claim.proofStatus!=='ATTESTED'||claim.revoked===true)
  reject('RUNTIME_PROOF_NOT_PROVIDER_VERIFIED');
 if(!verifyClock(claim.verifiedAt,now)||!verifyClock(claim.issuedAt,now)
   ||claim.validUntil<=now||!Number.isSafeInteger(claim.validUntil)
   ||claim.verifiedAt>claim.issuedAt||claim.validUntil-claim.issuedAt>86_400_000)
  reject('RUNTIME_PROOF_EXPIRED_OR_INVALID');
 if(policyProofKeys.some(k=>typeof claim[k]!=='string'||claim[k].length<6))
  reject('RUNTIME_PROVIDER_READBACK_INCOMPLETE');
 const desired=validateCustomerAiDeployment(profile);
 if(claim.networkMode!=='STANDARD'||desired.networkMode!=='STANDARD')
  reject('RUNTIME_PRIVATE_NETWORK_UNSUPPORTED');
 if(claim.deploymentMode!=='MANAGED_CLOUD'||desired.deploymentMode!=='MANAGED_CLOUD')
  reject('RUNTIME_DEPLOYMENT_UNSUPPORTED');
 // This shared Netlify gateway is not a local or air-gapped management plane.
 if(!exact(desired.provider,['MISTRAL_API','AZURE_OPENAI']))
  reject('RUNTIME_PROVIDER_UNSUPPORTED');
 return Object.freeze(claim);
}
const assertResponse=async(response,provider)=>{
 if(!response?.ok)throw new AiRuntimeDenied('RUNTIME_PROVIDER_HTTP_'+provider+'_'+String(response?.status??'UNKNOWN'));
 const body=await response.json().catch(()=>null);
 const content=body?.choices?.[0]?.message?.content;
 if(typeof content!=='string'||!content.trim())reject('RUNTIME_EMPTY_OR_INVALID_PROVIDER_RESULT');
 return Object.freeze({
  type:'Observation',text:content.trim(),confidence:0.5,
  containsRestrictedData:false,containsUnexpectedPII:false,
  providerUsage:body.usage??null
 });
};
const validIdentifier=(v,max=100)=>typeof v==='string'&&v.length>=2&&v.length<=max&&/^[a-zA-Z0-9_-]+$/.test(v);
const validModelId=v=>typeof v==='string'&&v.length>=2&&v.length<=120&&new RegExp('^[a-zA-Z0-9._:/-]+$').test(v);
export function createVerifiedCloudAdapters({fetchFn,config}={}){
 if(typeof fetchFn!=='function'||!config||typeof config!=='object')reject('RUNTIME_TRANSPORT_UNAVAILABLE');
 const registry=Object.create(null);
 if(config.MISTRAL_API){
  const c=config.MISTRAL_API;
  registry.MISTRAL_API=async({route,request})=>{
   if(!c.apiKey||c.endpointId!==route.endpointId||!validModelId(route.modelId)
      ||route.region!=='AUTO')
    reject('MISTRAL_RUNTIME_NOT_PROVISIONED');
   const response=await fetchFn('https://api.mistral.ai/v1/chat/completions',{
    method:'POST',signal:AbortSignal.timeout(12_000),headers:{authorization:'Bearer '+c.apiKey,'content-type':'application/json'},
    body:JSON.stringify({model:route.modelId,messages:request.messages,max_tokens:request.maxTokens,temperature:0})
   });
   return assertResponse(response,'MISTRAL_API');
  };
 }
 if(config.AZURE_OPENAI){
  const c=config.AZURE_OPENAI;
  registry.AZURE_OPENAI=async({route,request})=>{
   if(!c.apiKey||c.endpointId!==route.endpointId||!validIdentifier(c.resourceName,63)
      ||!validIdentifier(c.deploymentId,100)||!validIdentifier(c.apiVersion,32)
      ||c.deploymentId!==route.endpointId||c.processingRegion!==route.region)
    reject('AZURE_RUNTIME_NOT_PROVISIONED');
   const url='https://'+c.resourceName+'.openai.azure.com/openai/deployments/'
    +encodeURIComponent(c.deploymentId)+'/chat/completions?api-version='+encodeURIComponent(c.apiVersion);
   const response=await fetchFn(url,{
    method:'POST',signal:AbortSignal.timeout(12_000),headers:{'api-key':c.apiKey,'content-type':'application/json'},
    body:JSON.stringify({messages:request.messages,max_tokens:request.maxTokens,temperature:0})
   });
   return assertResponse(response,'AZURE_OPENAI');
  };
 }
 return Object.freeze(registry);
}
const validRequest=request=>request&&Array.isArray(request.messages)&&request.messages.length>0&&request.messages.length<=16
 &&Number.isSafeInteger(request.maxTokens)&&request.maxTokens>=1&&request.maxTokens<=2048
 &&request.messages.every(m=>m&&exact(m.role,['system','user','assistant'])&&typeof m.content==='string'&&m.content.length<=16000)
 &&request.messages.reduce((n,m)=>n+m.content.length,0)<=24000;
export async function runAttestedTenantChat({tenantId,useCaseId,profile,policyVersion,signedProof,key,request,config,fetchFn,now=Date.now()}={}){
 if(!validRequest(request))reject('RUNTIME_REQUEST_INVALID');
 const receipt=verifySignedRuntimeProof({signed:signedProof,key,tenantId,useCaseId,profile,policyVersion,now});
 const provision=config?.[receipt.provider];
 if(!provision||provision.providerReadbackEvidenceId!==receipt.providerReadbackEvidenceId
     ||provision.egressEvidenceId!==receipt.egressEvidenceId)
  reject('RUNTIME_PROVISIONING_EVIDENCE_MISMATCH');
 const adapters=createVerifiedCloudAdapters({fetchFn,config});
 const result=await invokeVerifiedAiRuntime({tenantId,profile,receipt,request,adapters,now});
 return Object.freeze({...result,provenance:Object.freeze({
  provider:receipt.provider,modelId:receipt.modelId,tenantId,
  useCaseId,evidenceId:receipt.evidenceId,providerReadbackEvidenceId:receipt.providerReadbackEvidenceId
 })});
}
