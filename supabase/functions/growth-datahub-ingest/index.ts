import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function blogContentId(canonical:string,payload:any){const explicit=String(payload?.content_id||'').trim();if(explicit)return explicit;try{const path=new URL(String(canonical||'')).pathname;const match=path.match(/^\/blog\/([a-z0-9-]+)\/?$/);return match?`blog:${match[1]}`:'';}catch{return '';}}
function eventType(type:string){const t=String(type||'').trim();if(t==='page_view'||t==='organic_landing')return 'visit';if(t==='money_link_click'||t==='primary_cta_click'||t==='secondary_cta_click')return 'cta';if(t==='engaged_view')return 'engagement';if(t==='lead_outcome'||t==='frisse_blik_start'||t==='selfscan_start')return 'lead';return t;}

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
  if(action==='learning_export'){
    const limit=Math.min(5000,Math.max(100,Number(body?.limit||5000)));
    const [{data:events,error:eventError},{data:outcomes,error:outcomeError}]=await Promise.all([
      client.from('growth_events').select('event_id,event_type,canonical,source,medium,campaign,occurred_at,payload').order('occurred_at',{ascending:false}).limit(limit),
      client.from('growth_outcomes').select('outcome_id,stage,canonical,occurred_at,revenue_eur,payload').order('occurred_at',{ascending:false}).limit(1000)
    ]);
    if(eventError||outcomeError)return json({error:'LEARNING_EXPORT_FAILED',detail:(eventError?.message||outcomeError?.message||'read failed').slice(0,300)},500);
    const normalized:any[]=[];
    for(const row of events||[]){const content_id=blogContentId(row.canonical,row.payload);if(!content_id)continue;normalized.push({event_id:String(row.event_id),occurred_at:row.occurred_at,content_id,content_type:String(row.payload?.content_type||'blog'),channel:String(row.payload?.channel||row.source||'website'),source:row.source||'',medium:row.medium||'',campaign:row.campaign||'',event_type:eventType(row.event_type),value:0,journey_id:null,order_id:null,attribution:null});}
    for(const row of outcomes||[]){const content_id=blogContentId(row.canonical,row.payload);if(!content_id)continue;const stage=String(row.stage||'').toLowerCase();const commercialType=stage==='won_order'?'order':stage==='revenue'?'revenue':stage==='qualified_lead'?'qualified_lead':stage==='lead'?'lead':stage==='proposal'||stage==='appointment'?'opportunity':'lead';normalized.push({event_id:`outcome:${row.outcome_id}`,occurred_at:row.occurred_at,content_id,content_type:String(row.payload?.content_type||'blog'),channel:String(row.payload?.channel||'website'),source:'commercial-outcome',medium:'',campaign:'',event_type:commercialType,value:commercialType==='revenue'?Number(row.revenue_eur||0):0,journey_id:null,order_id:String(row.payload?.order_id||row.outcome_id),attribution:String(row.payload?.attribution||'last_touch')});}
    return json({version:1,generated_at:new Date().toISOString(),events:normalized,counts:{source_events:(events||[]).length,source_outcomes:(outcomes||[]).length,normalized:normalized.length}},200);
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