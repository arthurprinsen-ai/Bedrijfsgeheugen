import { getUser } from '@netlify/identity';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';
import { createSupabasePortalProjectionStore } from './_portal-supabase-store.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, max-age=60, stale-while-revalidate=240',
  'content-type':'application/json; charset=utf-8',
  'vary':'authorization, cookie'
}});

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user?.id)return json({error:'UNAUTHENTICATED'},401);

  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return json({error:'TENANT_SCOPE_REQUIRED'},403);

  try{
    const store=createSupabasePortalProjectionStore();
    const payload=await store.getEntrepreneurIntelligence(tenantId);
    return json(payload,200);
  }catch(error){
    const message=String(error?.message||error||'');
    const configMissing=/configuration missing/i.test(message);
    return json({error:configMissing?'PORTAL_GATEWAY_CONFIG_MISSING':'ENTREPRENEUR_INTELLIGENCE_GATEWAY_FAILED'},configMissing?503:502);
  }
};

export const config={path:'/api/portal-ondernemersdata'};
