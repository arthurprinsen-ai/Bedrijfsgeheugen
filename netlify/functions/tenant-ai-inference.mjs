import {getUser} from '@netlify/identity';
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';
import {handleTenantAiInference} from '../../platform/api/tenant-ai-inference-handler.mjs';

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
 return handleTenantAiInference({
  request,user,tenantId,registry,proofKey,sovereignty,fetchFn:fetch
 });
};
export const config={path:'/api/tenant-ai-inference'};
