// Infrastructure-aware AI runtime routing. No cloud accounts or local machines are provisioned here.
// Only exact, customer-authorized runtime receipts can activate a route.
import {validateCustomerAiDeployment} from '../policy/customer-ai-deployment.mjs';

export class AiRuntimeDenied extends Error {
  constructor(reason) {super(reason);this.name='AiRuntimeDenied';this.code='AI_RUNTIME_NOT_VERIFIED';}
}
const same=(a,b)=>String(a??'')===String(b??'');
const freeze=o=>Object.freeze(o);
export function selectVerifiedAiRuntime({tenantId,profile,receipt,now=Date.now()}){
  if(typeof tenantId!=='string'||!tenantId.trim())throw new AiRuntimeDenied('TENANT_REQUIRED');
  let desired;
  try {desired=validateCustomerAiDeployment(profile);} catch {throw new AiRuntimeDenied('INVALID_CUSTOMER_AI_PROFILE');}
  if(!receipt||receipt.status!=='VERIFIED'||receipt.revoked===true)
    throw new AiRuntimeDenied('VERIFIED_RUNTIME_RECEIPT_REQUIRED');
  if(!same(receipt.tenantId,tenantId))throw new AiRuntimeDenied('TENANT_MISMATCH');
  for(const key of ['deploymentMode','provider','modelFamily','computeRegion','storageRegion','ragRegion','networkMode','modelId']){
    if(!same(receipt[key],desired[key]))throw new AiRuntimeDenied('RUNTIME_PROFILE_MISMATCH_'+key);
  }
  if(receipt.trainingUse!=='PROHIBITED'||receipt.allowExternalFallback!==false)
    throw new AiRuntimeDenied('RUNTIME_DATA_POLICY_MISMATCH');
  if(!Number.isFinite(receipt.validUntil)||receipt.validUntil<=now||!Number.isFinite(receipt.verifiedAt)||receipt.verifiedAt>now)
    throw new AiRuntimeDenied('RUNTIME_PROOF_EXPIRED');
  if(typeof receipt.evidenceId!=='string'||!receipt.evidenceId.trim())
    throw new AiRuntimeDenied('RUNTIME_EVIDENCE_MISSING');
  if(typeof receipt.endpointId!=='string'||!receipt.endpointId.trim())
    throw new AiRuntimeDenied('RUNTIME_ENDPOINT_MISSING');
  return freeze({tenantId,provider:desired.provider,modelId:desired.modelId,endpointId:receipt.endpointId,evidenceId:receipt.evidenceId,networkMode:desired.networkMode,region:desired.computeRegion});
}
// Only server-owned authorities may resolve receipts and review decisions. Do not
// accept caller-supplied "VERIFIED" objects as authorization to transmit customer data.
const REQUIRED_SCOPES=Object.freeze([
  'privacy','security','ai_governance','data_residency','supplier_risk',
  'finance','sustainability','csrd_esrs_scope','audit','customer_disclosure'
]);
const validId=value=>typeof value==='string'&&value.trim().length>0;
export async function invokeVerifiedAiRuntime({
  tenantId,profile,receipt,request,loadVerifiedReceipt,loadCrossDomainApproval,
  endpointRegistry,adapters,now=Date.now()
}={}){
  if(receipt!==undefined)throw new AiRuntimeDenied('CALLER_SUPPLIED_RECEIPT_FORBIDDEN');
  if(typeof loadVerifiedReceipt!=='function'||typeof loadCrossDomainApproval!=='function')
    throw new AiRuntimeDenied('SERVER_AUTHORITY_REQUIRED');
  // These dependencies must be wired exclusively on a trusted server, never supplied
  // from a browser, request body, user-controlled plugin or arbitrary customer config.
  let verified;
  try{verified=await loadVerifiedReceipt({tenantId,profile});}
  catch{throw new AiRuntimeDenied('VERIFIED_RECEIPT_LOOKUP_FAILED');}
  const route=selectVerifiedAiRuntime({tenantId,profile,receipt:verified,now});
  if(!validId(verified.changeId)||!validId(verified.customerConsentId)||
     !Number.isSafeInteger(verified.policyVersion)||verified.policyVersion<1)
    throw new AiRuntimeDenied('RUNTIME_CHANGE_CONSENT_EVIDENCE_MISSING');
  let approval;
  try{approval=await loadCrossDomainApproval({
    tenantId,changeId:verified.changeId,policyVersion:verified.policyVersion
  });}
  catch{throw new AiRuntimeDenied('CROSS_DOMAIN_APPROVAL_LOOKUP_FAILED');}
  if(!approval||approval.tenantId!==tenantId||approval.changeId!==verified.changeId||
     approval.policyVersion!==verified.policyVersion||approval.status!=='CLEARED'||
     approval.customerConsentId!==verified.customerConsentId||
     !Number.isFinite(approval.validUntil)||approval.validUntil<=now||
     !Array.isArray(approval.approvedScopes)||
     !REQUIRED_SCOPES.every(scope=>approval.approvedScopes.includes(scope))||
     !Array.isArray(approval.evidenceIds)||!approval.evidenceIds.includes(verified.evidenceId))
    throw new AiRuntimeDenied('CROSS_DOMAIN_APPROVAL_NOT_PROVEN');
  // Endpoint IDs are looked up in a private, server-controlled Map. Never turn a
  // profile or receipt endpointId into an arbitrary URL (SSRF/egress bypass).
  const registered=endpointRegistry instanceof Map?endpointRegistry.get(route.endpointId):null;
  if(!registered||registered.tenantId!==tenantId||
     registered.provider!==route.provider||registered.networkMode!==route.networkMode||
     !validId(registered.region)||registered.enabled!==true||
     (route.region!=='AUTO'&&route.region!==registered.region))
    throw new AiRuntimeDenied('PINNED_ENDPOINT_NOT_PROVEN');
  const adapter=adapters?.[route.provider];
  if(typeof adapter!=='function')throw new AiRuntimeDenied('RUNTIME_ADAPTER_UNAVAILABLE');
  // The provider adapter owns credential lookup and egress enforcement; there is
  // never an automatic cross-provider or public-network fallback.
  return adapter(freeze({route,request}));
}
