import { getUser } from '@netlify/identity';
import adapterContract from '../../config/brain-platform-adapters.json' with { type: 'json' };
import { createOperatingLoopStore } from '../../brain/operating-loop/store.mjs';
import { createRemoteRecordAdapter } from '../../brain/operating-loop/remote-record-adapter.mjs';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';
import { principalFromUser } from '../../brain/operating-loop/object-access-policy.mjs';
import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';
import { POWERHOUSE_SYSTEM_MAP } from '../../platform/system-map/canonical-system-map.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store',
  'pragma':'no-cache',
  'vary':'authorization, cookie',
  'x-robots-tag':'noindex, nofollow, noarchive',
  'x-content-type-options':'nosniff'
}});

const authorityUrl=()=>String(Netlify.env.get('BRAIN_OPERATING_AUTHORITY_URL')||'').trim();
const adminEmails=()=>String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim();


async function loadSupabaseSystemMapInventory(){
  const baseUrl=String(Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  const serviceToken=String(Netlify.env.get('BG_PORTAL_EU_SERVICE_TOKEN')||'').trim();
  if(!baseUrl||!serviceToken)return {status:'UNAVAILABLE',reason:'SUPABASE_INVENTORY_CONFIG_MISSING',inventory:null};
  try{
    const response=await fetch(`${baseUrl}/functions/v1/powerhouse-system-map-inventory`,{
      method:'POST',
      headers:{'content-type':'application/json','x-bg-service-token':serviceToken}
    });
    const body=await response.json().catch(()=>null);
    if(!response.ok)return {status:'UNAVAILABLE',reason:body?.error||`SUPABASE_INVENTORY_${response.status}`,inventory:null};
    return {status:'LIVE',reason:null,inventory:body?.inventory||null,generatedAt:body?.generatedAt||null};
  }catch(error){
    return {status:'UNAVAILABLE',reason:error?.message||'SUPABASE_INVENTORY_READ_FAILED',inventory:null};
  }
}

export default async request=>{
  if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+.+/i.test(authorization))return reply({error:'UNAUTHENTICATED'},401);
  const user=await getUser(request);
  if(!user?.id)return reply({error:'UNAUTHENTICATED'},401);
  if(!isPowerhouseAdmin(user,{allowedEmails:adminEmails()}))return reply({error:'POWERHOUSE_ADMIN_REQUIRED'},403);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return reply({error:'TENANT_UNRESOLVED'},403);
  let store;
  try{
    store=createOperatingLoopStore(createRemoteRecordAdapter({baseUrl:authorityUrl(),authorization}),{adapterContract});
  }catch(error){
    return reply({error:error?.message||'BRAIN_OPERATING_AUTHORITY_UNAVAILABLE'},503);
  }
  const principal=principalFromUser(user,tenantId);
  try{
    const projection=await store.getProjection(tenantId,{principal});
    const supabaseInventory=await loadSupabaseSystemMapInventory();
    return reply({ ...projection, systemMap:{...POWERHOUSE_SYSTEM_MAP,supabaseInventory} },200);
  }catch(error){
    if(error?.code==='OBJECT_ACCESS_DENIED')return reply({error:error.code},403);
    return reply({error:'OBSERVABILITY_UNAVAILABLE'},503);
  }
};

export const config={path:'/api/powerhouse-observability'};
