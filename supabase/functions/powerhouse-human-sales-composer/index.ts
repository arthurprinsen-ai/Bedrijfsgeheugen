import { createClient } from 'npm:@supabase/supabase-js@2';
const clean=(v:any)=>String(v??'').trim();
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data);}
Deno.serve(async(req)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=await secret(db,'powerhouse_daily_scheduler_token');
  if(!token||req.headers.get('x-powerhouse-token')!==token)return json({ok:false,error:'UNAUTHORIZED'},401);
  let input:any={};try{input=await req.json();}catch{}
  const actionId=clean(input?.action_id);if(!actionId)return json({ok:false,error:'ACTION_ID_REQUIRED'},400);
  const response=await fetch(url+'/functions/v1/powerhouse-commercial-message-composer',{
    method:'POST',
    headers:{'content-type':'application/json','x-powerhouse-token':token},
    body:JSON.stringify({limit:1,action_ids:[actionId]}),
    signal:AbortSignal.timeout(90000)
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.ok!==true)return json({ok:false,canonical:'powerhouse-commercial-message-composer',error:body?.error||'CANONICAL_COMPOSER_FAILED'},response.status||503);
  const result=(body?.results||[])[0]||null;
  return json({ok:true,canonical:'powerhouse-commercial-message-composer',composed:result?.quality_passed===true,result});
});