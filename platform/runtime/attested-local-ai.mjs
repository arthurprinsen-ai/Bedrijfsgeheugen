import {createHmac,timingSafeEqual} from 'node:crypto';
import {validateCustomerAiDeployment} from '../policy/customer-ai-deployment.mjs';
import {invokeVerifiedAiRuntime,AiRuntimeDenied} from '../brain/verified-ai-runtime.mjs';

// This module must run inside the customer-controlled local execution plane.
// It cannot make a hosted Netlify/Supabase function into an air-gapped appliance.
const SCHEMA='powerhouse-signed-local-runtime-proof-v1';
const reject=reason=>{throw new AiRuntimeDenied(reason);};
const stable=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)
  ?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const secret=key=>{
 if(typeof key!=='string'||Buffer.byteLength(key,'utf8')<32)reject('LOCAL_PROOF_SIGNING_KEY_UNAVAILABLE');
 return key;
};
const digest=(receipt,key)=>createHmac('sha256',secret(key)).update(SCHEMA+'\n'+stable(receipt)).digest();
const validId=v=>typeof v==='string'&&v.length>=2&&v.length<=128&&/^[a-zA-Z0-9._:/-]+$/.test(v);
const validDigest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/i.test(v);
const clock=(v,now)=>Number.isSafeInteger(v)&&v>0&&v<=now;
const validRequest=request=>request&&Array.isArray(request.messages)&&request.messages.length>=1&&request.messages.length<=16
 &&Number.isSafeInteger(request.maxTokens)&&request.maxTokens>=1&&request.maxTokens<=2048
 &&request.messages.every(m=>m&&['system','user','assistant'].includes(m.role)
  &&typeof m.content==='string'&&m.content.length<=16000)
 &&request.messages.reduce((n,m)=>n+m.content.length,0)<=24000;
const exactProfile=(receipt,profile)=>Object.keys(profile).every(k=>receipt[k]===profile[k]);

export function signLocalRuntimeProof({receipt,key}={}){
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))reject('INVALID_LOCAL_PROOF');
 return Object.freeze({schema:SCHEMA,receipt,signature:digest(receipt,key).toString('hex')});
}
export function verifyLocalRuntimeProof({signed,key,tenantId,useCaseId,policyVersion,profile,now=Date.now()}={}){
 if(!signed||signed.schema!==SCHEMA||!signed.receipt||!Number.isSafeInteger(now))reject('INVALID_LOCAL_PROOF');
 const sig=typeof signed.signature==='string'&&/^[0-9a-f]{64}$/i.test(signed.signature)
  ?Buffer.from(signed.signature,'hex'):null;
 if(!sig||!timingSafeEqual(sig,digest(signed.receipt,key)))reject('LOCAL_PROOF_SIGNATURE_INVALID');
 const p=validateCustomerAiDeployment(profile),r=signed.receipt;
 if(!validId(p.modelId)||!['ON_PREMISE','AIR_GAPPED'].includes(p.deploymentMode)||!['OLLAMA','VLLM'].includes(p.provider)
  ||p.computeRegion!=='LOCAL'||p.storageRegion!=='LOCAL'
  ||!['LOCAL','SAME_AS_STORAGE'].includes(p.ragRegion))reject('LOCAL_PROFILE_REQUIRED');
 if(r.tenantId!==tenantId||r.useCaseId!==useCaseId||!validId(tenantId)||!validId(useCaseId))
  reject('LOCAL_PROOF_TENANT_OR_USE_CASE_MISMATCH');
 if(!Number.isSafeInteger(policyVersion)||policyVersion<1||r.policyVersion!==policyVersion)
  reject('LOCAL_PROOF_POLICY_VERSION_STALE');
 if(!exactProfile(r,p)||r.status!=='VERIFIED'||r.revoked===true
  ||r.verifier!=='LOCAL_AGENT_READBACK'||r.proofStatus!=='ATTESTED')
  reject('LOCAL_PROVIDER_NOT_VERIFIED');
 if(!clock(r.verifiedAt,now)||!clock(r.issuedAt,now)
  ||!Number.isSafeInteger(r.validUntil)||r.validUntil<=now
  ||r.issuedAt<r.verifiedAt||r.validUntil-r.issuedAt>86_400_000)
  reject('LOCAL_PROOF_EXPIRED');
 if(!validId(r.evidenceId)||!validId(r.endpointId)||!validId(r.changeId)
  ||!validId(r.customerConsentId)||!validDigest(r.modelDigest)
  ||!validId(r.modelReadbackEvidenceId)||!validId(r.networkIsolationEvidenceId)
  ||!validId(r.storageAndRagEvidenceId)||!validId(r.healthEvidenceId))
  reject('LOCAL_RUNTIME_EVIDENCE_INCOMPLETE');
 if(p.deploymentMode==='AIR_GAPPED'&&(p.networkMode!=='OFFLINE'||r.offlineSystemAttested!==true))
  reject('AIR_GAP_NOT_ATTESTED');
 return Object.freeze(r);
}
function localAdapter(provider,config,fetchFn){
 return async({route,request})=>{
  if(route.provider!==provider||route.endpointId!==config.endpointId||route.region!=='LOCAL')
   reject('LOCAL_ENDPOINT_MISMATCH');
  const port=config.port;
  if(!Number.isSafeInteger(port)||port<1||port>65535)reject('LOCAL_PORT_INVALID');
  // The only allowed outbound destination is numeric loopback. Never accept a URL
  // from a tenant profile, signed receipt or request body (DNS rebinding / SSRF).
  const url='http://127.0.0.1:'+port+(provider==='OLLAMA'?'/api/chat':'/v1/chat/completions');
  const body=provider==='OLLAMA'
   ?{model:route.modelId,messages:request.messages,stream:false,options:{temperature:0,num_predict:request.maxTokens}}
   :{model:route.modelId,messages:request.messages,stream:false,temperature:0,max_tokens:request.maxTokens};
  let response;
  try{response=await fetchFn(url,{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(12_000),
   headers:{'content-type':'application/json'},body:JSON.stringify(body)
  });}catch{reject('LOCAL_MODEL_TRANSPORT_FAILED');}
  if(!response?.ok)reject('LOCAL_MODEL_HTTP_'+String(response?.status??'UNKNOWN'));
  const result=await response.json().catch(()=>null);
  const message=provider==='OLLAMA'?result?.message?.content:result?.choices?.[0]?.message?.content;
  if(typeof message!=='string'||!message.trim())reject('LOCAL_MODEL_RESPONSE_INVALID');
  return Object.freeze({type:'Observation',text:message.trim(),confidence:0.5,
   providerUsage:provider==='OLLAMA'
    ?{promptTokens:result.prompt_eval_count??null,completionTokens:result.eval_count??null}
    :result.usage??null});
 };
}
export async function runVerifiedLocalChat({
 tenantId,useCaseId,profile,policyVersion,request,
 loadSignedLocalProof,loadCrossDomainApproval,key,endpointRegistry,fetchFn,
 localOperatorAttestation,now=Date.now()
}={}){
 if(!validRequest(request))reject('LOCAL_REQUEST_INVALID');
 if(localOperatorAttestation!=='ISOLATED_LOCAL_EXECUTOR'||typeof fetchFn!=='function'
  ||typeof loadSignedLocalProof!=='function'||typeof loadCrossDomainApproval!=='function'
  ||!(endpointRegistry instanceof Map))reject('LOCAL_EXECUTION_AUTHORITY_REQUIRED');
 let signed;
 try{signed=await loadSignedLocalProof({tenantId,useCaseId,policyVersion});}
 catch{reject('LOCAL_PROOF_LOOKUP_FAILED');}
 const receipt=verifyLocalRuntimeProof({signed,key,tenantId,useCaseId,policyVersion,profile,now});
 const endpoint=endpointRegistry.get(receipt.endpointId);
 if(!endpoint||endpoint.tenantId!==tenantId||endpoint.provider!==receipt.provider
  ||endpoint.enabled!==true||endpoint.networkMode!==receipt.networkMode
  ||endpoint.region!=='LOCAL'||endpoint.modelId!==receipt.modelId
  ||endpoint.modelDigest!==receipt.modelDigest
  ||endpoint.networkIsolationEvidenceId!==receipt.networkIsolationEvidenceId
  ||endpoint.storageAndRagEvidenceId!==receipt.storageAndRagEvidenceId
  ||endpoint.healthEvidenceId!==receipt.healthEvidenceId
  ||endpoint.endpointId!==receipt.endpointId||endpoint.host!=='127.0.0.1'
  ||!Number.isSafeInteger(endpoint.port)||endpoint.port<1||endpoint.port>65535
  ||endpoint.localOnly!==true)reject('LOCAL_ENDPOINT_OR_ISOLATION_MISMATCH');
 const adapters=Object.freeze({[receipt.provider]:localAdapter(receipt.provider,endpoint,fetchFn)});
 const result=await invokeVerifiedAiRuntime({
  tenantId,profile,request,now,adapters,endpointRegistry,
  loadVerifiedReceipt:async()=>receipt,loadCrossDomainApproval
 });
 return Object.freeze({...result,provenance:Object.freeze({
  tenantId,useCaseId,provider:receipt.provider,modelId:receipt.modelId,
  modelDigest:receipt.modelDigest,evidenceId:receipt.evidenceId,
  networkIsolationEvidenceId:receipt.networkIsolationEvidenceId
 })});
}
