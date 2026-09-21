import { createClient } from 'npm:@supabase/supabase-js@2';

const SERVICE_TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function graphGet(url:string){
  const response=await fetch(url);
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.error)throw new Error('META_INSTAGRAM_GRAPH_REJECTED:'+clean(body?.error?.message||body?.message||response.status).slice(0,220));
  return body;
}
async function validateMeta(token:string,userId:string,version:string){
  const body=await graphGet(`https://graph.instagram.com/${version}/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`);
  const resolved=clean(body?.user_id||body?.id);
  if(!resolved||resolved!==userId)throw new Error('META_INSTAGRAM_USER_ID_MISMATCH');
  return {id:resolved,username:clean(body?.username)};
}
async function writeState(db:any,state:string,result:any){
  const now=new Date().toISOString();
  await db.from('brain_records').upsert({
    tenant_id:'canonical',record_id:'instagram-meta-direct-current-state-v1',record_type:'CurrentState',record_kind:'current_state',subject_id:'instagram-meta-direct',
    status:state,observed_at:now,executed:true,verified:true,result,payload:{fingerprint:'instagram-meta-direct-primary-v1',secret_values_exposed:false},
    idempotency_key:'instagram-meta-direct-current-state-v1',source_revision:'powerhouse-meta-instagram-setup',stored_at:now,updated_at:now
  },{onConflict:'tenant_id,record_id'});
}
async function storeRuntimeCredentials(db:any,accessToken:string,userId:string,version:string){
  const {data,error}=await db.rpc('powerhouse_set_meta_instagram_credentials_v1',{p_access_token:accessToken,p_user_id:userId,p_graph_version:version});
  if(error||data?.stored!==true)throw new Error('META_INSTAGRAM_CREDENTIAL_STORE_FAILED');
}
async function oauthExchange(db:any,code:string,redirectUri:string,version:string){
  const appId=await secret(db,'META_INSTAGRAM_APP_ID');
  const appSecret=await secret(db,'META_INSTAGRAM_APP_SECRET');
  if(!appId||!appSecret)throw new Error('META_INSTAGRAM_APP_CONFIG_REQUIRED');
  if(!code||!redirectUri)throw new Error('META_INSTAGRAM_OAUTH_CODE_REQUIRED');

  const shortResponse=await fetch('https://api.instagram.com/oauth/access_token',{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:appId,client_secret:appSecret,grant_type:'authorization_code',redirect_uri:redirectUri,code}).toString()
  });
  const short:any=await shortResponse.json().catch(()=>({}));
  if(!shortResponse.ok||!clean(short?.access_token))throw new Error('META_INSTAGRAM_OAUTH_EXCHANGE_FAILED:'+clean(short?.error_message||short?.error?.message||shortResponse.status).slice(0,220));

  const long:any=await graphGet(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(short.access_token)}`);
  const longToken=clean(long?.access_token);
  if(!longToken)throw new Error('META_INSTAGRAM_LONG_LIVED_TOKEN_MISSING');

  const me:any=await graphGet(`https://graph.instagram.com/${version}/me?fields=user_id,username&access_token=${encodeURIComponent(longToken)}`);
  const userId=clean(me?.user_id||short?.user_id||me?.id);
  if(!userId)throw new Error('META_INSTAGRAM_USER_ID_MISSING');

  await storeRuntimeCredentials(db,longToken,userId,version);
  return {user_id:userId,username:clean(me?.username),expires_in:Number(long?.expires_in||0)||null};
}
async function refreshToken(db:any,version:string){
  const token=await secret(db,'META_INSTAGRAM_ACCESS_TOKEN');
  const userId=await secret(db,'META_INSTAGRAM_USER_ID');
  if(!token||!userId)throw new Error('META_INSTAGRAM_AUTH_REQUIRED');
  const refreshed:any=await graphGet(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
  const nextToken=clean(refreshed?.access_token);
  if(!nextToken)throw new Error('META_INSTAGRAM_REFRESH_TOKEN_MISSING');
  const identity=await validateMeta(nextToken,userId,version);
  await storeRuntimeCredentials(db,nextToken,userId,version);
  return {user_id:userId,username:identity.username,expires_in:Number(refreshed?.expires_in||0)||null};
}

Deno.serve(async(req:Request)=>{
  try{
    if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
    const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
    if(!url||!serviceKey)return json({ok:false,error:'CONFIG'},500);
    const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const serviceToken=req.headers.get('x-bg-service-token')||'';
    if(!serviceToken||await sha256(serviceToken)!==SERVICE_TOKEN_HASH)return json({ok:false,error:'UNAUTHORIZED'},401);
    let body:any={};try{body=await req.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)}
    const action=clean(body.action)||'status';
    if(!['status','set_credentials','set_app_credentials','oauth_exchange','refresh_token','oauth_config'].includes(action))return json({ok:false,error:'UNSUPPORTED_ACTION'},400);

    let token=await secret(db,'META_INSTAGRAM_ACCESS_TOKEN');
    let userId=await secret(db,'META_INSTAGRAM_USER_ID');
    const appId=await secret(db,'META_INSTAGRAM_APP_ID');
    const appSecret=await secret(db,'META_INSTAGRAM_APP_SECRET');
    let version=(await secret(db,'META_INSTAGRAM_GRAPH_VERSION'))||'v24.0';

    if(action==='set_app_credentials'){
      const candidateAppId=clean(body.app_id),candidateAppSecret=clean(body.app_secret);
      if(!/^[0-9]+$/.test(candidateAppId))return json({ok:false,error:'META_INSTAGRAM_APP_ID_INVALID'},400);
      if(candidateAppSecret.length<20)return json({ok:false,error:'META_INSTAGRAM_APP_SECRET_INVALID'},400);
      const {data,error}=await db.rpc('powerhouse_set_meta_instagram_app_credentials_v1',{p_app_id:candidateAppId,p_app_secret:candidateAppSecret});
      if(error||data?.stored!==true)throw new Error('META_INSTAGRAM_APP_CREDENTIAL_STORE_FAILED');
      return json({ok:true,app_credentials_present:true,app_id:candidateAppId});
    }

    if(action==='oauth_config'){
      if(!appId||!appSecret)return json({ok:true,ready:false,app_credentials_present:false,reason:'META_INSTAGRAM_APP_CONFIG_REQUIRED'});
      return json({ok:true,ready:true,app_credentials_present:true,app_id:appId});
    }

    if(action==='oauth_exchange'){
      const result=await oauthExchange(db,clean(body.code),clean(body.redirect_uri),version);
      token=await secret(db,'META_INSTAGRAM_ACCESS_TOKEN');userId=result.user_id;
      const state={ready:true,state:'ACTIVE',provider:'meta',credentials_present:true,app_credentials_present:true,user_id:userId,username:result.username||null,graph_version:version,validated:true,expires_in:result.expires_in};
      await writeState(db,'ACTIVE',state);
      return json({ok:true,...state});
    }

    if(action==='refresh_token'){
      const result=await refreshToken(db,version);
      const state={ready:true,state:'ACTIVE',provider:'meta',credentials_present:true,app_credentials_present:!!appId&&!!appSecret,user_id:result.user_id,username:result.username||null,graph_version:version,validated:true,expires_in:result.expires_in,refreshed:true};
      await writeState(db,'ACTIVE',state);
      return json({ok:true,...state});
    }

    if(action==='set_credentials'){
      const candidateToken=clean(body.access_token),candidateUserId=clean(body.user_id),candidateVersion=clean(body.graph_version)||'v24.0';
      if(candidateToken.length<40)return json({ok:false,error:'META_INSTAGRAM_ACCESS_TOKEN_INVALID'},400);
      if(!/^[0-9]+$/.test(candidateUserId))return json({ok:false,error:'META_INSTAGRAM_USER_ID_INVALID'},400);
      if(!/^v\d+\.\d+$/.test(candidateVersion))return json({ok:false,error:'META_INSTAGRAM_GRAPH_VERSION_INVALID'},400);
      const identity=await validateMeta(candidateToken,candidateUserId,candidateVersion);
      await storeRuntimeCredentials(db,candidateToken,candidateUserId,candidateVersion);
      token=candidateToken;userId=candidateUserId;version=candidateVersion;
      const result={ready:true,state:'ACTIVE',provider:'meta',user_id:userId,username:identity.username||null,graph_version:version,credentials_present:true,app_credentials_present:!!appId&&!!appSecret,validated:true};
      await writeState(db,'ACTIVE',result);
      return json({ok:true,...result});
    }

    if(!token||!userId){
      const result={ready:false,state:'CONFIG_REQUIRED',provider:'meta',credentials_present:false,app_credentials_present:!!appId&&!!appSecret,graph_version:version,reason:'META_INSTAGRAM_AUTH_REQUIRED'};
      await writeState(db,'CONFIG_REQUIRED',result);
      return json({ok:true,...result});
    }
    try{
      const identity=await validateMeta(token,userId,version);
      const result={ready:true,state:'ACTIVE',provider:'meta',credentials_present:true,app_credentials_present:!!appId&&!!appSecret,user_id:userId,username:identity.username||null,graph_version:version,validated:true};
      await writeState(db,'ACTIVE',result);return json({ok:true,...result});
    }catch{
      const result={ready:false,state:'INVALID_CREDENTIALS',provider:'meta',credentials_present:true,app_credentials_present:!!appId&&!!appSecret,user_id:userId,graph_version:version,validated:false,reason:'META_INSTAGRAM_CREDENTIALS_REJECTED'};
      await writeState(db,'INVALID_CREDENTIALS',result);return json({ok:true,...result},409);
    }
  }catch(error){
    return json({ok:false,error:'META_INSTAGRAM_SETUP_FAILED',detail:(error instanceof Error?error.message:String(error)).slice(0,300)},503);
  }
});
