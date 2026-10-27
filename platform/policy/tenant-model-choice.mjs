import {resolveDesiredTenantModel} from './tenant-ai-default-model.mjs';
// A customer preference is NEVER a runtime authorization. This server-only
// gate binds the tenant's selected workload to separately signed runtime proof.
const SUPPORTED=Object.freeze({
 MISTRAL_API:Object.freeze({supplier:'Mistral AI',route:'mistral-api-eu'}),
 GOOGLE_VERTEX:Object.freeze({supplier:'Google',route:'vertex-ai-gemini'}),
 AWS_BEDROCK:Object.freeze({supplier:'Amazon',route:'amazon-bedrock-regional'})
});
const WORKLOAD='brain';
const deny=(code,modelId=null)=>Object.freeze({ok:false,code,modelId});
export function evaluateTenantModelChoice({tenantId,portalRecord,sovereigntyPolicy,registryRecord,catalog,supplierStatus}={}){
 if(typeof tenantId!=='string'||!tenantId)return deny('TENANT_ID_REQUIRED');
 if(portalRecord?.tenantId!==tenantId||!portalRecord.data)return deny('TENANT_PORTAL_STATE_REQUIRED');
 const prefs=portalRecord.data.portal?.aiModelPreferences;
 if(prefs?.requestState!=='review_only_not_activated'||!Array.isArray(prefs.models))
  return deny('MODEL_CHOICE_REQUIRED');
 const resolved=resolveDesiredTenantModel(prefs,WORKLOAD);
 if(!resolved.ok)
  return deny(resolved.code==='MODEL_WORKLOAD_NOT_ASSIGNED'?'BRAIN_MODEL_NOT_ASSIGNED':resolved.code);
 const desiredId=resolved.modelId;
 const model=catalog?.models?.find(x=>x.id===desiredId);
 if(!model||supplierStatus?.records?.[desiredId]!=='VERIFIED')
  return deny('SUPPLIER_CLAIMS_UNRESOLVED',desiredId);
 if(String(model.status||'').toLowerCase()!=='active')
  return deny('MODEL_LIFECYCLE_NOT_ACTIVE',desiredId);
 if(typeof model.provider_api_id!=='string'||!model.provider_api_id.trim())
  return deny('MODEL_API_ID_NOT_VERIFIED',desiredId);
 const selected={routeId:resolved.routeId};
 const proof=registryRecord?.signedProof?.receipt;
 if(!proof||proof.tenantId!==tenantId)
  return deny('SIGNED_TENANT_RUNTIME_PROOF_REQUIRED',desiredId);
 if(proof.useCaseId!=='portal-project-answer')
  return deny('SIGNED_USE_CASE_MISMATCH',desiredId);
 if(proof.modelId!==model.provider_api_id)
  return deny('SIGNED_PROVIDER_MODEL_MISMATCH',desiredId);
 // A customer's explicit EU Mistral route must never resolve to the global
 // Mistral API (which does not attest a specific inference geography).
 // The independently signed runtime proof must agree with the tenant profile.
 if(proof.provider==='MISTRAL_API'&&(
   sovereigntyPolicy?.ai_deployment_profile?.computeRegion!=='EU'||
   proof.computeRegion!=='EU'))
  return deny('MISTRAL_EU_INFERENCE_NOT_ATTESTED',desiredId);
 const route=SUPPORTED[proof.provider];
 if(!route||model.provider!==route.supplier||selected.routeId!==route.route)
  return deny('DEPLOYMENT_ROUTE_NOT_ATTESTED',desiredId);
 const preference=prefs.policy||'eu-both';
 if(preference==='strict')
  return deny('CUSTOMER_CONTROLLED_RUNTIME_REQUIRED',desiredId);
 if(!['review','eu-storage','eu-both'].includes(preference))
  return deny('INVALID_CUSTOMER_RESIDENCY_POLICY',desiredId);
 if(!sovereigntyPolicy||typeof sovereigntyPolicy!=='object')
  return deny('AUTHORITATIVE_SOVEREIGNTY_POLICY_REQUIRED',desiredId);
 if(preference==='eu-both'&&sovereigntyPolicy.mode!=='EU_ONLY')
  return deny('EU_PROCESSING_REQUIREMENT_NOT_ENFORCED',desiredId);
 if(preference==='eu-storage'&&!['EU_ONLY','EU_STORAGE'].includes(sovereigntyPolicy.mode))
  return deny('EU_STORAGE_REQUIREMENT_NOT_ENFORCED',desiredId);
 // The model binding does not establish provider entitlement, service region,
 // DPA, pricing, consent, signatures, expiry or runtime health. Those remain
 // independent mandatory checks in runAttestedTenantChat.
 return Object.freeze({ok:true,code:'MODEL_BINDING_CONFIRMED_RUNTIME_PROOF_STILL_REQUIRED',modelId:desiredId,workload:WORKLOAD,selectionSource:resolved.source});
}
