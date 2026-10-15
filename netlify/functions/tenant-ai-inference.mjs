import {getUser} from '@netlify/identity';
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';
import {handleTenantAiInference} from '../../platform/api/tenant-ai-inference-handler.mjs';
import {evaluateTenantModelChoice} from '../../platform/policy/tenant-model-choice.mjs';
import {createEuPrimaryPortalStore} from './_portal-eu-primary-store.mjs';
import {createSupabasePortalProjectionStore} from './_portal-supabase-store.mjs';
import {createPortalProjectionStore} from './_portal-read-model-store.mjs';
import modelCatalog from '../../data/ai-model-catalog-v1.json' with {type:'json'};
import supplierStatus from '../../portal-v2/ai-model-supplier-status-v1.json' with {type:'json'};

// The runtime registry and signing key exist only in the server environment.
// No provisioning, approvals or API secrets can be submitted from the browser.
const parseRegistry=raw=>{
 // Bound server-side registry parsing and reject ambiguous prototype keys.
 // A malformed registry must deny inference rather than fall back to any provider.
 if(typeof raw!=='string'||raw.length>131072)return null;
 try{
  const data=JSON.parse(raw||'null');
  if(Object.prototype.hasOwnProperty.call(data||{},'__proto__')||
     Object.prototype.hasOwnProperty.call(data||{},'constructor'))return null;
  return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
 }catch{return null;}
};
export default async request=>{
 const user=await getUser(request);
 const tenantId=resolveIdentityTenant(user);
 const registry=parseRegistry(Netlify.env.get('BG_TENANT_AI_VERIFIED_RUNTIME_REGISTRY'));
 const proofKey=Netlify.env.get('BG_TENANT_AI_PROOF_SIGNING_KEY');
 // Avoid initializing provider authority when the server route is unprovisioned.
 let sovereignty;
 try{if(registry&&proofKey)sovereignty=createDataSovereigntyClient();}
 catch{sovereignty=null;}
 // Retrieve preferences from the same authenticated EU-first portal projection.
 // No model choice, supplier approval, route or consent comes from request body.
 const choiceGuard=async({tenantId:ownTenant,registryRecord,sovereigntyPolicy})=>{
  const euStore=createSupabasePortalProjectionStore();
  const store=createEuPrimaryPortalStore({euStore,fallbackStore:createPortalProjectionStore()});
  const portalRecord=await store.get(ownTenant);
  return evaluateTenantModelChoice({
   tenantId:ownTenant,portalRecord,sovereigntyPolicy,registryRecord,
   catalog:modelCatalog,supplierStatus
  });
 };
 return handleTenantAiInference({
  request,user,tenantId,registry,proofKey,sovereignty,
  choiceGuard,fetchFn:fetch
 });
};
export const config={path:'/api/tenant-ai-inference'};
