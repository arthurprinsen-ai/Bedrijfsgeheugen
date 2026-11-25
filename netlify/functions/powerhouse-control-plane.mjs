import { getUser } from '@netlify/identity';
import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';
import { readPowerhouseIntegrationReadback } from '../../platform/portal/powerhouse-existing-integration-read-model.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

// Reuse the original canonical signed app-metadata admin role boundary; the
// synthetic production proof and other authenticated APIs use "powerhouse-admin".
// Keep the existing app_metadata.powerhouse_admin legacy grant, never user_metadata.
function hasAdminRole(user){
  return isPowerhouseAdmin(user) || user?.app_metadata?.powerhouse_admin===true;
}

export default async function handler(request){
  if(request?.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405);
  if(!/^Bearer\s+\S+$/i.test(request.headers?.get('authorization')||''))return json({error:'UNAUTHORIZED'},401);
  let user;
  try{user=await getUser(request);}
  catch{return json({error:'IDENTITY_PROVIDER_UNAVAILABLE'},503);}
  if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  if(!hasAdminRole(user))return json({error:'FORBIDDEN'},403);

  const baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL;
  const serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN;
  if(!baseUrl||!serviceToken)return json({error:'SERVER_CONFIG'},500);

  const response=await fetch(`${String(baseUrl).replace(/\/$/,'')}/functions/v1/portal-state-eu`,{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
    body:JSON.stringify({action:'control_plane_cockpit'})
  });
  const body=await response.json().catch(()=>({error:'INVALID_EDGE_RESPONSE'}));
  if(!response.ok)return json({error:body?.error||'CONTROL_PLANE_READ_FAILED'},response.status);
  // Existing admin session already passed before any Supabase service-role request.
  // Read-only and deliberately fail closed: SOURCE_READABLE != END_TO_END_VERIFIED.
  const systemIntegration=await readPowerhouseIntegrationReadback({
    baseUrl:globalThis.Netlify?.env?.get?.('SUPABASE_URL')||process.env.SUPABASE_URL||globalThis.Netlify?.env?.get?.('BG_PORTAL_EU_SUPABASE_URL')||process.env.BG_PORTAL_EU_SUPABASE_URL,
    key:globalThis.Netlify?.env?.get?.('SUPABASE_SERVICE_ROLE_KEY')||process.env.SUPABASE_SERVICE_ROLE_KEY,
    includeSalesExecutionAudit:true
  });
  // This header is emitted ONLY after first-party Identity and admin-role gates.
  // It exposes no row IDs or secrets and permits a genuine authenticated
  // source-scope readback (never a synthetic provider-delivery claim).
  const responseWithAudit=json({...body,systemIntegration},200);
  const scope=systemIntegration?.salesExecutionAudit?.scope;
  responseWithAudit.headers.set('x-bg-innovation-audit-scope',
    scope==='FULL_LAST_7D'||scope==='ABOVE_500_FAIL_CLOSED'?scope:'UNKNOWN');
  return responseWithAudit;
}

export const config={path:'/api/powerhouse-control-plane'};