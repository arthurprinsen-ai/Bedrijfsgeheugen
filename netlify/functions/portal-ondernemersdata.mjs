import { getUser } from '@netlify/identity';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';
import { createSupabasePortalProjectionStore } from './_portal-supabase-store.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{
  // Never cache authentication failures, upstream failures or temporary 503s.
  'cache-control':status>=400?'no-store':'private, max-age=60, stale-while-revalidate=240',
  'content-type':'application/json; charset=utf-8',
  'vary':'authorization, cookie',
  ...(status===503?{'retry-after':'20'}:{})
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
    const timedOut=/PORTAL_INTELLIGENCE_UPSTREAM_TIMEOUT/.test(message);
    // Operator-only failure categories, never raw messages, tenant IDs, credentials or query payloads.
    const upstreamStatus=/^EU portal store gateway failed \\((401|403|429|500|502|503|504)\\)$/.exec(message)?.[1]||null;
    const failureCategory=configMissing?'CONFIG_MISSING'
      :timedOut?'UPSTREAM_DEADLINE'
      :upstreamStatus?'UPSTREAM_HTTP_'+upstreamStatus
      :/tenant scope mismatch/i.test(message)?'TENANT_SCOPE_MISMATCH'
      :/response shape invalid/i.test(message)?'UPSTREAM_RESPONSE_SHAPE'
      :error?.name==='TypeError'?'UPSTREAM_NETWORK_FETCH'
      :'UPSTREAM_UNKNOWN_FAILURE';
    console.error('PORTAL_ENTREPRENEUR_GATEWAY_FAILED category='+failureCategory);
    const code=configMissing?'PORTAL_GATEWAY_CONFIG_MISSING'
      :timedOut?'PORTAL_INTELLIGENCE_UPSTREAM_TIMEOUT':'ENTREPRENEUR_INTELLIGENCE_GATEWAY_FAILED';
    return json({error:code},configMissing||timedOut?503:502);
  }
};

export const config={path:'/api/portal-ondernemersdata'};
