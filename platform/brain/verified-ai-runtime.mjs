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
export async function invokeVerifiedAiRuntime({tenantId,profile,receipt,request,adapters,now}){
  const route=selectVerifiedAiRuntime({tenantId,profile,receipt,now});
  const adapter=adapters?.[route.provider];
  if(typeof adapter!=='function')throw new AiRuntimeDenied('RUNTIME_ADAPTER_UNAVAILABLE');
  // No cross-provider fallback on error: route is chosen once, before sending any data.
  return adapter(freeze({route,request}));
}
