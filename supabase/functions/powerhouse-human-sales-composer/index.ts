import { createClient } from 'npm:@supabase/supabase-js@2';
const clean=(v:any)=>String(v??'').trim();
const J=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function secret(db:any,n:string){const e=Deno.env.get(n);if(e)return clean(e);const {data}=await db.rpc('bg_geheim',{p_naam:n});return clean(data);}
Deno.serve(async(req)=>{
  if(req.method!=='POST')return J({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!role)return J({ok:false,error:'CONFIG'},500);
  const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=await secret(db,'powerhouse_daily_scheduler_token');
  if(!token||req.headers.get('x-powerhouse-token')!==token)return J({ok:false,error:'UNAUTHORIZED'},401);
  let input:any={};try{input=await req.json()}catch{}
  const actionId=clean(input?.action_id);if(!actionId)return J({ok:false,error:'ACTION_ID_REQUIRED'},400);
  const r=await fetch(url+'/functions/v1/powerhouse-commercial-message-composer',{
    method:'POST',
    headers:{'content-type':'application/json','x-powerhouse-token':token},
    body:JSON.stringify({limit:1,action_ids:[actionId]}),
    signal:AbortSignal.timeout(90000)
  });
  const body:any=await r.json().catch(()=>({}));
  if(!r.ok||body?.ok!==true)return J({ok:false,contract:'powerhouse-human-sales-composer-compat-v1',canonical:'powerhouse-commercial-message-composer',error:body?.error||'CANONICAL_COMPOSER_FAILED'},r.status||503);
  const result=(body?.results||[])[0]||null;
  return J({ok:true,contract:'powerhouse-human-sales-composer-compat-v1',canonical:'powerhouse-commercial-message-composer',composed:result?.quality_passed===true,state:result?.quality_passed===true?'QUALITY_PASS':'QUALITY_HOLD',result});
});