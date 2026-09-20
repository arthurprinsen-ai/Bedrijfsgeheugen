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
    return reply({ ...projection, systemMap:POWERHOUSE_SYSTEM_MAP },200);
  }catch(error){
    if(error?.code==='OBJECT_ACCESS_DENIED')return reply({error:error.code},403);
    return reply({error:'OBSERVABILITY_UNAVAILABLE'},503);
  }
};

export const config={path:'/api/powerhouse-observability'};
