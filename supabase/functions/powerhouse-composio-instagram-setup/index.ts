import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE='https://backend.composio.dev/api/v3.1';
const SUBJECT='instagram-composio-setup';
const USER_ID='bedrijfsgeheugen-owner';
const ALIAS='bedrijfsgeheugen-instagram';
const SERVICE_TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const clean=(v:unknown)=>String(v??'').trim();
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function api(key:string,path:string,init:RequestInit={}){const r=await fetch(BASE+path,{...init,headers:{'x-api-key':key,'content-type':'application/json',...(init.headers||{})}});const b:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error('COMPOSIO_SETUP_'+r.status+':'+clean(b?.error||b?.message||JSON.stringify(b)).slice(0,240));return b;}
async function instagramIdentity(key:string,accountId:string){
 const r=await fetch('https://backend.composio.dev/api/v3.1/tools/execute/proxy',{method:'POST',headers:{'x-api-key':key,'content-type':'application/json'},body:JSON.stringify({endpoint:'/me?fields=id,username',method:'GET',connected_account_id:accountId,parameters:[]})});
 const b:any=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error('COMPOSIO_INSTAGRAM_HEALTH_'+r.status+':'+clean(b?.error||b?.message||JSON.stringify(b)).slice(0,180));
 const username=clean(b?.data?.username||b?.body?.data?.username||b?.data?.data?.username).toLowerCase();
 const id=clean(b?.data?.id||b?.body?.data?.id||b?.data?.data?.id);
 if(!username)throw new Error('COMPOSIO_INSTAGRAM_USERNAME_MISSING');
 return {username,id};
}
async function writeState(db:any,state:string,result:any){const now=new Date().toISOString();await db.from('brain_records').upsert({
 tenant_id:'canonical',record_id:'instagram-composio-setup-current-state-v1',record_type:'CurrentState',record_kind:'current_state',subject_id:SUBJECT,
 status:state,observed_at:now,executed:true,verified:true,result,payload:{fingerprint:'instagram-composio-connect-link-setup-v1',secret_values_exposed:false},
 idempotency_key:'instagram-composio-setup-current-state-v1',source_revision:'powerhouse-composio-instagram-setup',stored_at:now,updated_at:now
},{onConflict:'tenant_id,record_id'});}

Deno.serve(async(req:Request)=>{
 try{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!serviceKey)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  const schedulerOk=Boolean(expected&&req.headers.get('x-powerhouse-token')===expected);
  const serviceToken=req.headers.get('x-bg-service-token')||'';
  const serviceOk=Boolean(serviceToken&&await sha256(serviceToken)===SERVICE_TOKEN_HASH);
  if(!schedulerOk&&!serviceOk)return json({ok:false,error:'UNAUTHORIZED'},401);
  let body:any={};try{body=await req.json()}catch{}
  const action=clean(body.action)||'status';

  let key=await secret(db,'COMPOSIO_API_KEY');
  if(action==='set_api_key'){
    if(!serviceOk)return json({ok:false,error:'ADMIN_SERVICE_AUTH_REQUIRED'},403);
    const candidate=clean(body.api_key);
    if(candidate.length<20)return json({ok:false,error:'COMPOSIO_API_KEY_INVALID'},400);
    try{await api(candidate,'/auth_configs?limit=1')}catch(error){
      const detail=error instanceof Error?error.message:'COMPOSIO_API_KEY_REJECTED';
      return json({ok:false,error:'COMPOSIO_API_KEY_REJECTED',detail:detail.slice(0,180)},400);
    }
    const {data:stored,error:storeError}=await db.rpc('powerhouse_set_composio_api_key_v1',{p_secret:candidate});
    if(storeError||stored?.stored!==true)throw new Error('COMPOSIO_API_KEY_STORE_FAILED');
    key=candidate;
  }

  if(!key){
    const result={ready:false,state:'BLOCKED_EXTERNAL_CONFIG',reason:'COMPOSIO_INSTAGRAM_AUTH_REQUIRED',api_key_present:false,active_accounts:0,resume_condition:'COMPOSIO_API_KEY_PRESENT'};
    await writeState(db,'BLOCKED_EXTERNAL_CONFIG',result);
    return json({ok:true,...result});
  }

  const accountsBody=await api(key,'/connected_accounts?toolkit_slugs=instagram&statuses=ACTIVE&account_type=ALL&limit=50');
  const accounts=(Array.isArray(accountsBody?.items)?accountsBody.items:[]).filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&!x?.is_disabled);
  const healthy:any[]=[];
  const rejected:any[]=[];
  for(const candidate of accounts){
    const accountId=clean(candidate?.id||candidate?.connected_account_id);
    if(!accountId)continue;
    try{
      const identity=await instagramIdentity(key,accountId);
      if(identity.username!=='bedrijfsgeheugen.nl'){
        rejected.push({account_id:accountId,alias:clean(candidate?.alias)||null,username:identity.username,reason:'IDENTITY_MISMATCH'});
        continue;
      }
      healthy.push({account:candidate,accountId,identity});
    }catch(error){
      const message=error instanceof Error?error.message:String(error);
      rejected.push({account_id:accountId,alias:clean(candidate?.alias)||null,reason:message.includes('401')?'REVOKED_OR_UNAUTHORIZED':'HEALTHCHECK_FAILED'});
    }
  }
  const canonical=healthy.filter(x=>clean(x.account?.alias)==='bedrijfsgeheugen-mira-canonical');
  const selectable=canonical.length===1?canonical:healthy;
  if(selectable.length>1){
    const result={ready:false,state:'AMBIGUOUS',reason:'COMPOSIO_INSTAGRAM_HEALTHY_CONNECTION_AMBIGUOUS',api_key_present:true,active_accounts:accounts.length,healthy_accounts:healthy.length,rejected_accounts:rejected};
    await writeState(db,'BLOCKED_AMBIGUOUS',result);return json({ok:true,...result},409);
  }
  if(selectable.length===1){
    const selected=selectable[0],account=selected.account,result:any={ready:true,state:'ACTIVE',reason:null,api_key_present:true,active_accounts:accounts.length,healthy_accounts:healthy.length,rejected_accounts:rejected,health_verified:true,canonical_alias_selected:clean(account?.alias)==='bedrijfsgeheugen-mira-canonical',connected_account_id:selected.accountId,user_id:clean(account?.user_id),alias:clean(account?.alias),username:selected.identity.username,instagram_user_id:selected.identity.id||null};
    await writeState(db,'ACTIVE',result);
    if(action==='resume'){
      if(!serviceOk)return json({ok:false,error:'ADMIN_SERVICE_AUTH_REQUIRED'},403);
      if(!expected)return json({ok:false,error:'SCHEDULER_AUTH_REQUIRED'},503);
      const publisherResponse=await fetch(url+'/functions/v1/powerhouse-social-publisher',{
        method:'POST',
        headers:{'content-type':'application/json','x-powerhouse-token':expected},
        body:JSON.stringify({runDate:localDate(),trigger:'composio-oauth-complete'})
      });
      const publisher:any=await publisherResponse.json().catch(()=>({}));
      result.resume_attempted=true;
      result.publisher_http=publisherResponse.status;
      result.publisher_ok=publisherResponse.ok&&publisher?.ok!==false;
      result.publisher_results=Array.isArray(publisher?.results)?publisher.results:[];
      await writeState(db,result.publisher_ok?'ACTIVE_RESUMED':'ACTIVE_RESUME_FAILED',result);
      return json({ok:result.publisher_ok,...result},result.publisher_ok?200:502);
    }
    return json({ok:true,...result});
  }
  if(action==='status'||action==='set_api_key'||action==='resume'){
    const result={ready:false,state:'CONNECTION_REQUIRED',reason:accounts.length?'COMPOSIO_INSTAGRAM_REAUTH_REQUIRED':'COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED',api_key_present:true,active_accounts:accounts.length,healthy_accounts:healthy.length,rejected_accounts:rejected,stored:action==='set_api_key'?true:undefined};
    await writeState(db,'CONNECTION_REQUIRED',result);return json({ok:true,...result});
  }
  if(action!=='create_link')return json({ok:false,error:'UNSUPPORTED_ACTION'},400);

  const configsBody=await api(key,'/auth_configs?toolkit_slug=instagram&is_composio_managed=true&show_disabled=false&limit=50');
  let configs=(Array.isArray(configsBody?.items)?configsBody.items:[]).filter((x:any)=>x?.is_composio_managed===true&&clean(x?.status).toUpperCase()!=='DISABLED');
  if(configs.length>1)return json({ok:false,error:'COMPOSIO_INSTAGRAM_AUTH_CONFIG_AMBIGUOUS',count:configs.length},409);
  let authConfigId=clean(configs[0]?.id);
  if(!authConfigId){
    const created=await api(key,'/auth_configs',{method:'POST',body:JSON.stringify({toolkit:{slug:'instagram'},auth_config:{type:'use_composio_managed_auth',credentials:{},restrict_to_following_tools:[]}})});
    authConfigId=clean(created?.auth_config?.id||created?.id);
  }
  if(!authConfigId)throw new Error('COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID_MISSING');

  const link=await api(key,'/connected_accounts/link',{method:'POST',body:JSON.stringify({auth_config_id:authConfigId,user_id:USER_ID,alias:ALIAS})});
  const redirectUrl=clean(link?.redirect_url),connectedAccountId=clean(link?.connected_account_id);
  if(!redirectUrl)throw new Error('COMPOSIO_INSTAGRAM_REDIRECT_URL_MISSING');
  const result={ready:false,state:'AUTH_LINK_READY',reason:'USER_OAUTH_REQUIRED',api_key_present:true,active_accounts:0,auth_config_id:authConfigId,connected_account_id:connectedAccountId||null,link_available:true,expires_at:clean(link?.expires_at)||null};
  await writeState(db,'AUTH_LINK_READY',result);
  return json({ok:true,...result,redirect_url:redirectUrl});
 }catch(error){const detail=error instanceof Error?error.message:'unknown';return json({ok:false,error:'COMPOSIO_INSTAGRAM_SETUP_FAILED',detail:detail.slice(0,300)},503)}
});
