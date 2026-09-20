import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE='https://backend.composio.dev/api/v3.1';
const SUBJECT='instagram-composio-setup';
const USER_ID='bedrijfsgeheugen-owner';
const ALIAS='bedrijfsgeheugen-instagram';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function api(key:string,path:string,init:RequestInit={}){const r=await fetch(BASE+path,{...init,headers:{'x-api-key':key,'content-type':'application/json',...(init.headers||{})}});const b:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error('COMPOSIO_SETUP_'+r.status+':'+clean(b?.error||b?.message||JSON.stringify(b)).slice(0,240));return b;}
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
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
  let body:any={};try{body=await req.json()}catch{}
  const action=clean(body.action)||'status';
  const key=await secret(db,'COMPOSIO_API_KEY');
  if(!key){
    const result={ready:false,state:'BLOCKED_EXTERNAL_CONFIG',reason:'COMPOSIO_INSTAGRAM_AUTH_REQUIRED',api_key_present:false,active_accounts:0,resume_condition:'COMPOSIO_API_KEY_PRESENT'};
    await writeState(db,'BLOCKED_EXTERNAL_CONFIG',result);
    return json({ok:true,...result});
  }

  const accountsBody=await api(key,'/connected_accounts?toolkit_slugs=instagram&statuses=ACTIVE&account_type=ALL&limit=50');
  const accounts=(Array.isArray(accountsBody?.items)?accountsBody.items:[]).filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&!x?.is_disabled);
  if(accounts.length>1){
    const result={ready:false,state:'AMBIGUOUS',reason:'COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS',api_key_present:true,active_accounts:accounts.length};
    await writeState(db,'BLOCKED_AMBIGUOUS',result);return json({ok:true,...result},409);
  }
  if(accounts.length===1){
    const account=accounts[0],result={ready:true,state:'ACTIVE',reason:null,api_key_present:true,active_accounts:1,connected_account_id:clean(account?.id),user_id:clean(account?.user_id),alias:clean(account?.alias)};
    await writeState(db,'ACTIVE',result);return json({ok:true,...result});
  }
  if(action==='status'){
    const result={ready:false,state:'CONNECTION_REQUIRED',reason:'COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED',api_key_present:true,active_accounts:0};
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
