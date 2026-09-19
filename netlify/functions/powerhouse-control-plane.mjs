import { getUser } from '@netlify/identity';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

function hasAdminRole(user){
  const roles=[
    ...(Array.isArray(user?.app_metadata?.roles)?user.app_metadata.roles:[]),
    ...(Array.isArray(user?.roles)?user.roles:[])
  ].map(value=>String(value||'').trim().toLowerCase());
  return user?.app_metadata?.powerhouse_admin===true || roles.includes('admin') || roles.includes('powerhouse_admin');
}

export default async function handler(){
  const user=await getUser();
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
  return json(body,200);
}

export const config={path:'/api/powerhouse-control-plane'};