import { createClient } from 'npm:@supabase/supabase-js@2';
import { authorizePowerhouseScheduler } from '../_shared/powerhouse-scheduler-auth.ts';

const USE_CASE='supabase-powerhouse-predictive-first-mover-v1';
const FALLBACK_USE_CASE='supabase-powerhouse-predictive-first-mover-fallback-v1';
const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:any)=>String(v??'').trim();
const sha=async(v:string)=>{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');};
const clamp=(n:any)=>Math.max(0,Math.min(1,Number(n)||0));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

function fallbackEligible(message:string){
  const s=clean(message).toLowerCase();
  return s.includes('credit balance is too low') || /AI_(401|403|429|5\d\d)/i.test(message) || s==='ai_key_unavailable';
}
function parseForecastJson(raw:string){
  const cleaned=clean(raw).replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();
  const parsed=JSON.parse(cleaned);
  if(!parsed || !Array.isArray(parsed.forecasts)) throw new Error('COMPOSIO_FORECAST_SCHEMA_INVALID');
  return parsed;
}
async function callComposioForecast(db:any,model:string,system:string,payload:any,schema:any){
  const key=clean((await db.rpc('bg_geheim',{p_naam:'COMPOSIO_API_KEY'})).data);
  if(!key) throw new Error('COMPOSIO_GENERATION_KEY_UNAVAILABLE');
  const strictSystem=system+' Return ONLY one valid JSON object matching this JSON schema exactly: '+JSON.stringify(schema)+'. No markdown or extra prose. Use only supplied evidence_keys; never invent evidence.';
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':key},
    body:JSON.stringify({version:'latest',arguments:{model,temperature:0.2,max_tokens:4200,messages:[
      {role:'system',content:strictSystem},
      {role:'user',content:JSON.stringify(payload)}
    ]}}),
    signal:AbortSignal.timeout(45000)
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true) throw new Error('COMPOSIO_GENERATION_FAILED:'+response.status+':'+clean(body?.error||body?.message||body?.data?.message).slice(0,200));
  const text=clean(body?.data?.choices?.[0]?.message?.content);
  if(!text) throw new Error('COMPOSIO_GENERATION_EMPTY');
  return parseForecastJson(text);
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const auth=await authorizePowerhouseScheduler(req);
  if(!auth.ok) return json({ok:false,error:auth.error},auth.status);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const [{data:gov},{data:external},{data:keywords},{data:existing},{data:learnings}]=await Promise.all([
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id',USE_CASE).maybeSingle(),
      db.from('bg_externe_signalen').select('url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,deadline').eq('toegestaan',true).gte('gepubliceerd_op',new Date(Date.now()-14*86400000).toISOString()).order('vertrouwen',{ascending:false}).limit(50),
      db.from('bg_zoekwoordkansen').select('zoekwoord,zaadwoord,zoekvolume,concurrentie,kansscore,positie,rankende_url,opgehaald_op').is('afgewezen_reden',null).order('kansscore',{ascending:false}).limit(30),
      db.from('powerhouse_forecasts').select('forecast_id,forecast_key,topic_key,predicted_event,status,probability,confidence,expected_by,horizon_end').in('status',['active','claimed']).order('updated_at',{ascending:false}).limit(30),
      db.from('revenue_learnings').select('claim,effect_metric,effect_size,confidence,status').in('status',['TESTING','PROVEN','WEAKENING']).order('confidence',{ascending:false}).limit(20)
    ]);
    if(!gov||gov.approved!==true||gov.lifecycle_status!=='ACTIVE'||gov.provider!=='Anthropic') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey=clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data); if(!apiKey) throw new Error('AI_KEY_UNAVAILABLE');

    const signalRows:any[]=[];
    for(const s of external||[]){
      const key=`external:${await sha(s.url)}`;
      signalRows.push({signal_key:key,observed_at:s.gepubliceerd_op||new Date().toISOString(),source_type:'external_news',source_ref:s.url,entity_scope:'market',entity_key:s.onderwerp,topic_key:s.onderwerp,signal_type:'market_signal',direction:'emerging',strength:clamp(s.vertrouwen),novelty:clamp(1-Number(s.bevestiging||0)*0.5),lead_time_days:s.deadline?Math.max(0,Math.round((new Date(s.deadline).getTime()-Date.now())/86400000)):30,evidence:{title:s.titel,summary:String(s.samenvatting||'').slice(0,1200),domain:s.domein,source_trust:s.brontrouw,confirmation:s.bevestiging,freshness:s.versheid,relevance:s.relevantie}});
    }
    for(const k of keywords||[]){
      const key=`search:${await sha(k.zoekwoord)}`;
      const sat=k.concurrentie==null?0.5:clamp(Number(k.concurrentie)/100);
      signalRows.push({signal_key:key,observed_at:k.opgehaald_op||new Date().toISOString(),source_type:'search_demand',source_ref:`keyword:${k.zoekwoord}`,entity_scope:'market',entity_key:k.zaadwoord||k.zoekwoord,topic_key:k.zaadwoord||k.zoekwoord,signal_type:'search_precursor',direction:'rising',strength:clamp(Math.min(1,Number(k.kansscore||0)/20)),novelty:clamp(1-sat),lead_time_days:45,evidence:{keyword:k.zoekwoord,search_volume:k.zoekvolume,competition:k.concurrentie,opportunity_score:k.kansscore,position:k.positie,ranking_url:k.rankende_url}});
    }
    if(signalRows.length){
      for(let i=0;i<signalRows.length;i+=15){
        const batch=signalRows.slice(i,i+15);
        const {error}=await db.from('powerhouse_predictive_signals').upsert(batch,{onConflict:'signal_key'});
        if(error) throw new Error('SIGNAL_BATCH_UPSERT:'+error.message);
      }
    }
    const {data:signals}=await db.from('powerhouse_predictive_signals').select('signal_id,signal_key,observed_at,source_type,source_ref,entity_scope,entity_key,topic_key,signal_type,direction,strength,novelty,lead_time_days,evidence').gte('observed_at',new Date(Date.now()-21*86400000).toISOString()).order('strength',{ascending:false}).limit(80);
    if(!signals?.length){await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-predictive-engine',soort:'predictive-run',status:'ok',detail:'NO_EVIDENCE_NO_FORECAST',gegevens:{contract:'predictive-first-mover-intelligence-v1'}});return json({ok:true,signals:0,forecasts:0,reason:'NO_EVIDENCE'});}

    const tool={name:'forecast_plan',description:'Evidence-bound predictive market forecasts',input_schema:{type:'object',additionalProperties:false,properties:{forecasts:{type:'array',maxItems:6,items:{type:'object',additionalProperties:false,properties:{topic_key:{type:'string'},scope:{type:'string',enum:['segment','market','technology','regulation','behavior']},scope_key:{type:'string'},predicted_event:{type:'string'},predicted_problem:{type:'string'},predicted_question:{type:'string'},predicted_search_intent:{type:'string'},predicted_buying_trigger:{type:'string'},probability:{type:'number',minimum:0,maximum:1},confidence:{type:'number',minimum:0,maximum:1},expected_lead_days:{type:'integer',minimum:1,maximum:180},signal_acceleration:{type:'number',minimum:0,maximum:1},market_saturation:{type:'number',minimum:0,maximum:1},whitespace_score:{type:'number',minimum:0,maximum:1},strategic_fit:{type:'number',minimum:0,maximum:1},revenue_potential:{type:'number',minimum:0,maximum:1},prediction_mode:{type:'string',enum:['anticipatory','category_creation','reactive']},evidence_keys:{type:'array',minItems:2,maxItems:8,items:{type:'string'}},rationale:{type:'string'}},required:['topic_key','scope','scope_key','predicted_event','predicted_problem','predicted_question','predicted_search_intent','predicted_buying_trigger','probability','confidence','expected_lead_days','signal_acceleration','market_saturation','whitespace_score','strategic_fit','revenue_potential','prediction_mode','evidence_keys','rationale']}}},required:['forecasts']}};
    const payload={today:today(),goal:{realized_revenue_eur:1000000,deadline:'2027-09-14'},signals:(signals||[]).map((s:any)=>({signal_key:s.signal_key,source_type:s.source_type,topic_key:s.topic_key,direction:s.direction,strength:s.strength,novelty:s.novelty,lead_time_days:s.lead_time_days,evidence:s.evidence})),existing_forecasts:existing||[],revenue_learnings:learnings||[]};
    const primarySystem='Je bent de voorspellende intelligence-laag van Bedrijfsgeheugen. Vind combinaties van zwakke signalen die waarschijnlijk 7-90 dagen vóór brede marktzichtbaarheid een MKB-probleem, zoekintentie of buying trigger voorspellen. Reageer niet simpelweg op populair nieuws. Hoge marktverzadiging verlaagt first-mover waarde. Gebruik uitsluitend evidence_keys uit de input. Minimaal twee onafhankelijke signalen per forecast; category_creation alleen bij minimaal drie overtuigende signalen en duidelijke semantic whitespace. Voorspellingen zijn probabilistisch, nooit feiten. Optimaliseer voor first-mover voordeel én commerciële relevantie richting €1m gerealiseerde omzet uiterlijk 2027-09-14.';
    let input:any=null;
    let generationProvider=clean(gov.provider);
    let generationModel=clean(gov.model_id);
    let fallbackReason:string|null=null;
    try{
      const ai=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:gov.model_id,max_tokens:4200,system:primarySystem,messages:[{role:'user',content:JSON.stringify(payload)}],tools:[tool],tool_choice:{type:'tool',name:'forecast_plan'}}),signal:AbortSignal.timeout(45000)});
      const ab:any=await ai.json().catch(()=>({}));
      if(!ai.ok) throw new Error(`AI_${ai.status}:${clean(ab?.error?.message).slice(0,200)}`);
      input=(ab.content||[]).find((x:any)=>x.type==='tool_use'&&x.name==='forecast_plan')?.input;
      if(!input||!Array.isArray(input.forecasts)) throw new Error('AI_TOOL_OUTPUT_MISSING');
    }catch(primaryError:any){
      const message=clean(primaryError?.message||primaryError);
      if(!fallbackEligible(message)) throw primaryError;
      const {data:fallbackGov,error:fallbackGovError}=await db.from('brain_ai_governance_registry')
        .select('model_id,provider,approved,lifecycle_status')
        .eq('tenant_id','canonical').eq('use_case_id',FALLBACK_USE_CASE).maybeSingle();
      if(fallbackGovError||!fallbackGov||fallbackGov.approved!==true||fallbackGov.lifecycle_status!=='ACTIVE'||fallbackGov.provider!=='Composio/Groq') throw primaryError;
      input=await callComposioForecast(db,clean(fallbackGov.model_id),primarySystem,payload,tool.input_schema);
      generationProvider=clean(fallbackGov.provider);
      generationModel=clean(fallbackGov.model_id);
      fallbackReason=message.slice(0,240);
    }
    const byKey=new Map((signals||[]).map((s:any)=>[s.signal_key,s]));
    let written=0,rejected=0;
    for(const f of input?.forecasts||[]){
      const refs=(f.evidence_keys||[]).map((k:string)=>byKey.get(k)).filter(Boolean);
      const uniqueSources=new Set(refs.map((r:any)=>r.source_ref||r.signal_key));
      const minRefs=f.prediction_mode==='category_creation'?3:2;
      if(uniqueSources.size<minRefs||Number(f.probability)<0.45||Number(f.confidence)<0.5){rejected++;continue;}
      const scoreRpc=await db.rpc('powerhouse_recompute_first_mover_score',{p_probability:f.probability,p_confidence:f.confidence,p_acceleration:f.signal_acceleration,p_strategic_fit:f.strategic_fit,p_revenue_potential:f.revenue_potential,p_whitespace:f.whitespace_score,p_market_saturation:f.market_saturation,p_expected_lead_days:f.expected_lead_days});
      const score=Number(scoreRpc.data||0);
      const expectedBy=new Date(Date.now()+Number(f.expected_lead_days)*86400000).toISOString().slice(0,10);
      const forecastKey=`pfm:${await sha(`${f.topic_key}|${f.predicted_event}|${f.prediction_mode}|${expectedBy}`)}`;
      const row={forecast_key:forecastKey,horizon_start:today(),horizon_end:expectedBy,expected_by:expectedBy,scope:f.scope,scope_key:f.scope_key,topic_key:f.topic_key,predicted_event:f.predicted_event,predicted_problem:f.predicted_problem,predicted_question:f.predicted_question,predicted_search_intent:f.predicted_search_intent,predicted_buying_trigger:f.predicted_buying_trigger,probability:f.probability,confidence:f.confidence,expected_lead_days:f.expected_lead_days,first_mover_score:score,strategic_fit:f.strategic_fit,revenue_potential:f.revenue_potential,signal_acceleration:f.signal_acceleration,market_saturation:f.market_saturation,whitespace_score:f.whitespace_score,prediction_mode:f.prediction_mode,evidence_signal_ids:refs.map((r:any)=>r.signal_id),evidence:{rationale:f.rationale,evidence_keys:f.evidence_keys,contract:'predictive-first-mover-intelligence-v1',generation_provider:generationProvider,generation_model:generationModel,primary_model:gov.model_id,fallback_reason:fallbackReason},status:'active',last_scored_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      const {error}=await db.from('powerhouse_forecasts').upsert(row,{onConflict:'forecast_key'}); if(error) throw error; written++;
    }
    const {data:queue}=await db.from('powerhouse_first_mover_queue').select('*').order('action_score',{ascending:false}).limit(10);
    await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-predictive-engine',soort:'predictive-run',status:'ok',detail:`signals=${signals.length}; forecasts=${written}; rejected=${rejected}; provider=${generationProvider}; model=${generationModel}; fallback=${fallbackReason?'yes':'no'}`,gegevens:{contract:'predictive-first-mover-intelligence-v1',queue_top:(queue||[]).slice(0,5).map((q:any)=>({forecast_id:q.forecast_id,topic_key:q.topic_key,action_score:q.action_score,prediction_mode:q.prediction_mode}))}});
    return json({ok:true,signals:signals.length,forecasts_written:written,rejected,provider:generationProvider,model:generationModel,fallback_reason:fallbackReason,queue:queue||[]});
  }catch(e:any){
    try{
      await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-predictive-engine',soort:'predictive-run',status:'fout',detail:String(e?.message||e).slice(0,400),gegevens:{contract:'predictive-first-mover-intelligence-v1'}});
    }catch{}
    return json({ok:false,error:String(e?.message||e).slice(0,500)},500);
  }
});