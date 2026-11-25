import {getUser} from '@netlify/identity';
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';
import {createEuPrimaryPortalStore} from './_portal-eu-primary-store.mjs';
import {createSupabasePortalProjectionStore} from './_portal-supabase-store.mjs';
import {createPortalProjectionStore} from './_portal-read-model-store.mjs';
import {handleTenantAiActivationStatus} from '../../platform/api/tenant-ai-activation-handler.mjs';
import catalog from '../../data/ai-model-catalog-v1.json' with {type:'json'};
import supplierStatus from '../../portal-v2/ai-model-supplier-status-v1.json' with {type:'json'};

// Read-only readiness: tenant-specific and no automatic credential provision,
// signed proof issuance or model activation. The browser cannot supply a tenant ID.
const parseRegistry=value=>{
 if(typeof value!=='string'||value.length>131072)return null;
 try{
  const data=JSON.parse(value);
  return data&&typeof data==='object'&&!Array.isArray(data)&&
   !Object.prototype.hasOwnProperty.call(data,'__proto__')&&
   !Object.prototype.hasOwnProperty.call(data,'constructor')?data:null;
 }catch{return null;}
};
export default async request=>{
 const user=await getUser(request),tenantId=resolveIdentityTenant(user);
 if(!user?.id||!tenantId)return Response.json({error:'UNAUTHORIZED'},{
  status:401,headers:{'cache-control':'private, no-store'}});
 if(request.method!=='GET')return Response.json({error:'METHOD_NOT_ALLOWED'},{
  status:405,headers:{'cache-control':'private, no-store'}});
 let store,sovereignty;
 try{
  store=createEuPrimaryPortalStore({
   euStore:createSupabasePortalProjectionStore(),
   fallbackStore:createPortalProjectionStore()
  });
  sovereignty=createDataSovereigntyClient();
 }catch{
  return Response.json({error:'AUTHORITATIVE_READBACK_UNAVAILABLE'},{
   status:503,headers:{'cache-control':'private, no-store'}});
 }
 return handleTenantAiActivationStatus({
  request,user,tenantId,store,sovereignty,
  registry:parseRegistry(Netlify.env.get('BG_TENANT_AI_VERIFIED_RUNTIME_REGISTRY')),
  proofKey:Netlify.env.get('BG_TENANT_AI_PROOF_SIGNING_KEY'),
  catalog,supplierStatus
 });
};
export const config={path:'/api/tenant-ai-activation-status'};
