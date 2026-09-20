import { getUser } from '@netlify/identity';
import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store',
  'pragma':'no-cache',
  'vary':'authorization, cookie',
  'x-robots-tag':'noindex, nofollow, noarchive',
  'x-content-type-options':'nosniff'
}});
const adminEmails=()=>String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim();

export default async request=>{
  if(!['GET','POST'].includes(request.method))return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+.+/i.test(authorization))return reply({error:'UNAUTHENTICATED'},401);
  const user=await getUser(request);
  if(!user?.id)return reply({error:'UNAUTHENTICATED'},401);
  if(!isPowerhouseAdmin(user,{allowedEmails:adminEmails()}))return reply({error:'POWERHOUSE_ADMIN_REQUIRED'},403);

  const baseUrl=String(Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  const serviceToken=String(Netlify.env.get('BG_PORTAL_EU_SERVICE_TOKEN')||'').trim();
  if(!baseUrl||!serviceToken)return reply({error:'SERVER_CONFIG'},500);

  let body={action:'status'};
  if(request.method==='POST'){
    try{body=await request.json()}catch{return reply({error:'INVALID_JSON'},400)}
  }
  const action=String(body?.action||'status').trim();
  if(!['status','set_api_key','create_link','resume'].includes(action))return reply({error:'INVALID_ACTION'},400);
  const payload={action};
  if(action==='set_api_key'){
    const apiKey=String(body?.apiKey||'').trim();
    if(apiKey.length<20)return reply({error:'COMPOSIO_API_KEY_INVALID'},400);
    payload.api_key=apiKey;
  }

  const response=await fetch(`${baseUrl}/functions/v1/powerhouse-composio-instagram-setup`,{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
    body:JSON.stringify(payload)
  });
  const data=await response.json().catch(()=>({error:'INVALID_EDGE_RESPONSE'}));
  return reply(data,response.status);
};

export const config={path:'/api/powerhouse-composio-config'};
