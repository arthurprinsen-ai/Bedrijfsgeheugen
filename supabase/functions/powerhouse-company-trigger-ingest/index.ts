import { createClient } from 'npm:@supabase/supabase-js@2';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown,max=1000)=>String(v??'').trim().slice(0,max);
const clamp=(v:unknown,min=0,max=1)=>Math.min(max,Math.max(min,Number(v)||0));

function jwtRole(req:Request){
  const auth=req.headers.get('authorization')||'';
  const token=auth.replace(/^Bearer\s+/i,'');
  const payload=token.split('.')[1]||'';
  if(!payload)return '';
  try{
    const normalized=payload.replace(/-/g,'+').replace(/_/g,'/');
    const padded=normalized+'='.repeat((4-normalized.length%4)%4);
    return String(JSON.parse(atob(padded))?.role||'');
  }catch{return ''}
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  if(jwtRole(req)!=='service_role')return json({error:'SERVICE_ROLE_REQUIRED'},403);

  let body:any;
  try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}

  const sourceRef=clean(body?.source_ref,1500);
  const entityKey=clean(body?.entity_key,300);
  const topicKey=clean(body?.topic_key,240);
  const signalKey=clean(body?.signal_key,300);
  const sourceType=clean(body?.source_type,120);
  const signalType=clean(body?.signal_type,120);
  const direction=clean(body?.direction,80)||'emerging';
  const observedAt=clean(body?.observed_at,80);
  const evidence=body?.evidence&&typeof body.evidence==='object'&&!Array.isArray(body.evidence)?body.evidence:null;
  const observedFact=clean(evidence?.observed_fact,1500);
  const provenance=clean(evidence?.provenance,1500);

  if(!signalKey||!sourceType||!sourceRef||!entityKey||!topicKey||!signalType||!observedAt||!observedFact||!provenance){
    return json({error:'INCOMPLETE_OBSERVED_TRIGGER'},422);
  }
  if(Number.isNaN(Date.parse(observedAt)))return json({error:'INVALID_OBSERVED_AT'},422);

  const url=Deno.env.get('SUPABASE_URL');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

  const row={
    signal_key:signalKey,
    observed_at:new Date(observedAt).toISOString(),
    source_type:sourceType,
    source_ref:sourceRef,
    entity_scope:'company',
    entity_key:entityKey,
    topic_key:topicKey,
    signal_type:signalType,
    direction,
    strength:clamp(body?.strength),
    novelty:clamp(body?.novelty),
    lead_time_days:Number.isFinite(Number(body?.lead_time_days))?Math.max(1,Math.min(365,Math.round(Number(body.lead_time_days)))):30,
    evidence:{...evidence,contract:'powerhouse-company-trigger-ingest-v1',hypothesis_not_fact:true}
  };

  const {data:signal,error}=await client.from('powerhouse_predictive_signals')
    .upsert(row,{onConflict:'signal_key'})
    .select('signal_id,signal_key,entity_key,topic_key,observed_at')
    .single();
  if(error)return json({error:'SIGNAL_STORE_FAILED',detail:error.message.slice(0,300)},500);

  const opportunityKey='trigger:'+signal.signal_id;
  const {data:opportunity,error:readError}=await client.from('powerhouse_opportunities')
    .select('opportunity_id,opportunity_key,company_key,topic_key,stage,probability,confidence,expected_value_eur,expected_revenue_value,evidence,status')
    .eq('opportunity_key',opportunityKey)
    .maybeSingle();
  if(readError)return json({error:'OPPORTUNITY_READBACK_FAILED',detail:readError.message.slice(0,300)},500);
  if(!opportunity)return json({error:'TRIGGER_MATERIALIZATION_MISSING'},500);

  return json({stored:true,signal,opportunity},201);
});
