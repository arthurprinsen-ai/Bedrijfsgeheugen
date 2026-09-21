import { createClient } from 'npm:@supabase/supabase-js@2';

const SERVICE_TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function validateMeta(token:string,userId:string,version:string){
  const url=`https://graph.instagram.com/${version}/${encodeURIComponent(userId)}?fields=id,username&access_token=${encodeURIComponent(token)}`;
  const response=await fetch(url);
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.error)throw new Error('META_INSTAGRAM_CREDENTIALS_REJECTED:'+clean(body?.error?.message||body?.message||response.status).slice(0,220));
  if(clean(body?.id)!==userId)throw new Error('META_INSTAGRAM_USER_ID_MISMATCH');
  return {id:clean(body.id),username:clean(body.username)};
}
async function writeState(db:any,state:string,result:any){
  const now=new Date().toISOString();
  await db.from('brain_records').upsert({
    tenant_id:'canonical',record_id:'instagram-meta-direct-current-state-v1',record_type:'CurrentState',record_kind:'current_state',subject_id:'instagram-meta-direct',
    status:state,observed_at:now,executed:true,verified:true,result,payload:{fingerprint:'instagram-meta-direct-primary-v1',secret_values_exposed:false},
    idempotency_key:'instagram-meta-direct-current-state-v1',source_revision:'powerhouse-meta-instagram-setup',stored_at:now,updated_at:now
  },{onConflict:'tenant_id,record_id'});
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
    if(!['status','set_credentials'].includes(action))return json({ok:false,error:'UNSUPPORTED_ACTION'},400);

    let token=await secret(db,'META_INSTAGRAM_ACCESS_TOKEN');
    let userId=await secret(db,'META_INSTAGRAM_USER_ID');
    let version=(await secret(db,'META_INSTAGRAM_GRAPH_VERSION'))||'v24.0';

    if(action==='set_credentials'){
      const candidateToken=clean(body.access_token),candidateUserId=clean(body.user_id),candidateVersion=clean(body.graph_version)||'v24.0';
      if(candidateToken.length<40)return json({ok:false,error:'META_INSTAGRAM_ACCESS_TOKEN_INVALID'},400);
      if(!/^[0-9]+$/.test(candidateUserId))return json({ok:false,error:'META_INSTAGRAM_USER_ID_INVALID'},400);
      if(!/^v\d+\.\d+$/.test(candidateVersion))return json({ok:false,error:'META_INSTAGRAM_GRAPH_VERSION_INVALID'},400);
      const identity=await validateMeta(candidateToken,candidateUserId,candidateVersion);
      const {data:stored,error}=await db.rpc('powerhouse_set_meta_instagram_credentials_v1',{p_access_token:candidateToken,p_user_id:candidateUserId,p_graph_version:candidateVersion});
      if(error||stored?.stored!==true)throw new Error('META_INSTAGRAM_CREDENTIAL_STORE_FAILED');
      token=candidateToken;userId=candidateUserId;version=candidateVersion;
      const result={ready:true,state:'ACTIVE',provider:'meta',user_id:userId,username:identity.username||null,graph_version:version,credentials_present:true,validated:true};
      await writeState(db,'ACTIVE',result);
      return json({ok:true,...result});
    }

    if(!token||!userId){
      const result={ready:false,state:'CONFIG_REQUIRED',provider:'meta',credentials_present:false,graph_version:version,reason:'META_INSTAGRAM_AUTH_REQUIRED'};
      await writeState(db,'CONFIG_REQUIRED',result);
      return json({ok:true,...result});
    }
    try{
      const identity=await validateMeta(token,userId,version);
      const result={ready:true,state:'ACTIVE',provider:'meta',credentials_present:true,user_id:userId,username:identity.username||null,graph_version:version,validated:true};
      await writeState(db,'ACTIVE',result);return json({ok:true,...result});
    }catch(error){
      const result={ready:false,state:'INVALID_CREDENTIALS',provider:'meta',credentials_present:true,user_id:userId,graph_version:version,validated:false,reason:'META_INSTAGRAM_CREDENTIALS_REJECTED'};
      await writeState(db,'INVALID_CREDENTIALS',result);return json({ok:true,...result},409);
    }
  }catch(error){
    return json({ok:false,error:'META_INSTAGRAM_SETUP_FAILED',detail:(error instanceof Error?error.message:String(error)).slice(0,300)},503);
  }
});
