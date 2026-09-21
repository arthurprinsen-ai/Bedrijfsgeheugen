import { getUser } from '@netlify/identity';
import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store','pragma':'no-cache','vary':'authorization, cookie',
  'x-robots-tag':'noindex, nofollow, noarchive','x-content-type-options':'nosniff'
}});
const adminEmails=()=>String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim();
const bytesToB64url=bytes=>Buffer.from(bytes).toString('base64url');
const hmac=async(secret,value)=>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return bytesToB64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));
};
const edgeCall=async(baseUrl,serviceToken,payload)=>{
  const response=await fetch(`${baseUrl}/functions/v1/powerhouse-meta-instagram-setup`,{
    method:'POST',headers:{'content-type':'application/json','x-bg-service-token':serviceToken},body:JSON.stringify(payload)
  });
  const data=await response.json().catch(()=>({error:'INVALID_EDGE_RESPONSE'}));
  return {response,data};
};

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
  if(request.method==='POST'){try{body=await request.json()}catch{return reply({error:'INVALID_JSON'},400)}}
  const action=String(body?.action||'status').trim();
  if(!['status','set_credentials','set_app_credentials','start_oauth'].includes(action))return reply({error:'INVALID_ACTION'},400);

  if(action==='start_oauth'){
    const {response,data}=await edgeCall(baseUrl,serviceToken,{action:'oauth_config'});
    if(!response.ok||data?.ready!==true)return reply(data,response.status);
    const redirectUri='https://www.bedrijfsgeheugen.nl/api/powerhouse-meta-instagram-oauth-callback';
    const payload=bytesToB64url(Buffer.from(JSON.stringify({uid:user.id,exp:Date.now()+10*60*1000,nonce:crypto.randomUUID()})));
    const signature=await hmac(serviceToken,payload);
    const state=`${payload}.${signature}`;
    const authorize=new URL('https://www.instagram.com/oauth/authorize');
    authorize.searchParams.set('client_id',String(data.app_id));
    authorize.searchParams.set('redirect_uri',redirectUri);
    authorize.searchParams.set('response_type','code');
    authorize.searchParams.set('scope','instagram_business_basic,instagram_business_content_publish');
    authorize.searchParams.set('state',state);
    return reply({ok:true,authorize_url:authorize.toString(),redirect_uri:redirectUri});
  }

  const payload={action};
  if(action==='set_credentials'){
    payload.access_token=String(body?.accessToken||'').trim();
    payload.user_id=String(body?.userId||'').trim();
    payload.graph_version=String(body?.graphVersion||'v24.0').trim();
    if(payload.access_token.length<40||!/^\d+$/.test(payload.user_id)||!/^v\d+\.\d+$/.test(payload.graph_version))return reply({error:'META_INSTAGRAM_CREDENTIALS_INVALID'},400);
  }
  if(action==='set_app_credentials'){
    payload.app_id=String(body?.appId||'').trim();
    payload.app_secret=String(body?.appSecret||'').trim();
    if(!/^\d+$/.test(payload.app_id)||payload.app_secret.length<20)return reply({error:'META_INSTAGRAM_APP_CREDENTIALS_INVALID'},400);
  }
  const {response,data}=await edgeCall(baseUrl,serviceToken,payload);
  return reply(data,response.status);
};

export const config={path:'/api/powerhouse-meta-instagram-config'};
