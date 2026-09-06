import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body?.action||'');
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  if(action==='event'){
    const {data,error}=await client.rpc('bg_growth_ingest_event',{p_event:body.event});
    if(error)return json({error:'EVENT_STORE_FAILED',detail:error.message.slice(0,300)},500);
    return json({datahub:'supabase:growth_events',result:data},200);
  }
  if(action==='outcome'){
    const {data,error}=await client.rpc('bg_growth_ingest_outcome',{p_outcome:body.outcome});
    if(error)return json({error:'OUTCOME_STORE_FAILED',detail:error.message.slice(0,300)},500);
    return json({datahub:'supabase:growth_outcomes',result:data},200);
  }
  if(action==='brain_delivery'){
    const queueId=String(body?.queue_id||'').trim();
    const state=String(body?.state||'').trim().toUpperCase();
    if(!queueId||!['DELIVERED','BLOCKED','QUEUED'].includes(state))return json({error:'INVALID_BRAIN_DELIVERY'},400);
    const patch:any={state,updated_at:new Date().toISOString()};
    if(state==='DELIVERED')patch.delivered_at=new Date().toISOString();
    if(body?.attempted)patch.last_attempt_at=new Date().toISOString();
    if(body?.attempted)patch.attempts=Number(body?.attempts||1);
    if(body?.last_error)patch.last_error=String(body.last_error).slice(0,500);
    const {data,error}=await client.from('growth_brain_queue').update(patch).eq('queue_id',queueId).select('queue_id,state,attempts,delivered_at,last_error').maybeSingle();
    if(error)return json({error:'BRAIN_QUEUE_UPDATE_FAILED',detail:error.message.slice(0,300)},500);
    return json({datahub:'supabase:growth_brain_queue',result:data},200);
  }
  if(action==='status'){
    const [{count:eventCount,error:eventError},{count:outcomeCount,error:outcomeError},{count:queuedCount,error:queueError}]=await Promise.all([
      client.from('growth_events').select('*',{count:'exact',head:true}),
      client.from('growth_outcomes').select('*',{count:'exact',head:true}),
      client.from('growth_brain_queue').select('*',{count:'exact',head:true}).neq('state','DELIVERED')
    ]);
    if(eventError||outcomeError||queueError)return json({error:'STATUS_READ_FAILED'},500);
    return json({datahub:'supabase:growth',events:eventCount||0,outcomes:outcomeCount||0,brain_queue_open:queuedCount||0},200);
  }
  return json({error:'INVALID_ACTION'},400);
});