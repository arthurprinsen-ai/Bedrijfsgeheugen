import { getUser } from '@netlify/identity';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';
function env(name){return Netlify.env.get(name)||'';}
function endpoint(){const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');return base?`${base}/functions/v1/powerhouse-scan-ingest`:'';}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'private, no-store','vary':'authorization, cookie'}});
async function edge(payload){const url=endpoint(),token=env('BG_PORTAL_EU_SERVICE_TOKEN');if(!url||!token)return json({error:'SERVER_CONFIG'},503);const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify(payload)});return new Response(await response.text(),{status:response.status,headers:{'content-type':'application/json','cache-control':'private, no-store','vary':'authorization, cookie'}});}
export default async request=>{
  if(!['GET','POST'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
  const user=await getUser();if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  const tenantId=resolveIdentityTenant(user);if(!tenantId)return json({error:'FORBIDDEN'},403);
  if(request.method==='GET')return edge({action:'history',tenant_id:tenantId});
  let body;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  const submissionKey=String(body?.submission_key||'').trim();if(!submissionKey)return json({error:'INVALID_SUBMISSION_KEY'},422);
  return edge({action:'claim',tenant_id:tenantId,submission_key:submissionKey});
};
export const config={path:'/api/portal-scans'};
