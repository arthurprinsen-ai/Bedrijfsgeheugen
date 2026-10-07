import { createClient } from 'npm:@supabase/supabase-js@2';
import { authorizePowerhouseScheduler } from '../_shared/powerhouse-scheduler-auth.ts';

const USE_CASE='supabase-powerhouse-predictive-first-mover-v1';
const FALLBACK_USE_CASE='supabase-powerhouse-forecast-calibration-fallback-v1';
const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:any)=>String(v??'').trim();

function fallbackEligible(message:string){
  const s=clean(message).toLowerCase();
  return s.includes('credit balance is too low') || /^ai_(401|402|403|429|5\d\d):/i.test(message) || s==='ai_key_unavailable';
}
function parseCalibrationJson(raw:string){
  const cleaned=clean(raw).replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();
  const parsed=JSON.parse(cleaned);
  if(!parsed || !['materialized','missed','uncertain'].includes(clean(parsed.outcome))) throw new Error('COMPOSIO_CALIBRATION_SCHEMA_INVALID');
  return parsed;
}
async function callComposioCalibration(db:any,model:string,system:string,user:any){
  const key=clean((await db.rpc('bg_geheim',{p_naam:'COMPOSIO_API_KEY'})).data);
  if(!key) throw new Error('COMPOSIO_GENERATION_KEY_UNAVAILABLE');
  const strictSystem=system+' Return ONLY one JSON object with keys outcome, confidence, actual_event_at, evidence_refs, reason. outcome must be materialized, missed, or uncertain. Choose uncertain whenever evidence is insufficient; never infer a negative from silence.';
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':key},
    body:JSON.stringify({version:'latest',arguments:{model,temperature:0.1,max_tokens:1400,messages:[
      {role:'system',content:strictSystem},
      {role:'user',content:JSON.stringify(user)}
    ]}}),
    signal:AbortSignal.timeout(45000)
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true) throw new Error('COMPOSIO_GENERATION_FAILED:'+response.status+':'+clean(body?.error||body?.message||body?.data?.message).slice(0,200));
  const text=clean(body?.data?.choices?.[0]?.message?.content);
  if(!text) throw new Error('COMPOSIO_GENERATION_EMPTY');
  return parseCalibrationJson(text);
}
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const auth=await authorizePowerhouseScheduler(req);
  if(!auth.ok) return json({ok:false,error:auth.error},auth.status);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const [{data:gov},{data:due},{data:external},{data:keywords},{data:outcomes}]=await Promise.all([
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id',USE_CASE).maybeSingle(),
      db.from('revenue_learning_obligations').select('*').eq('tenant_id','canonical').eq('type','FORECAST_CALIBRATION').eq('status','OPEN').lte('due_at',new Date().toISOString()).order('due_at',{ascending:true}).limit(12),
      db.from('bg_externe_signalen').select('url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,vertrouwen').eq('toegestaan',true).gte('gepubliceerd_op',new Date(Date.now()-30*86400000).toISOString()).order('vertrouwen',{ascending:false}).limit(60),
      db.from('bg_zoekwoordkansen').select('zoekwoord,zaadwoord,zoekvolume,concurrentie,kansscore,positie,rankende_url,opgehaald_op').is('afgewezen_reden',null).order('kansscore',{ascending:false}).limit(40),
      db.from('growth_outcomes').select('stage,canonical,revenue_eur,occurred_at,attribution_root_key').gte('occurred_at',new Date(Date.now()-90*86400000).toISOString()).order('occurred_at',{ascending:false}).limit(200)
    ]);
    if(!gov||gov.approved!==true||gov.lifecycle_status!=='ACTIVE'||gov.provider!=='Anthropic') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    if(!due?.length){await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-forecast-calibrator',soort:'calibration-run',status:'ok',detail:'NO_DUE_CALIBRATIONS',gegevens:{contract:'predictive-first-mover-intelligence-v1'}});return json({ok:true,due:0,calibrated:0});}
    const apiKey=clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data); if(!apiKey) throw new Error('AI_KEY_UNAVAILABLE');
    const tool={name:'calibration',description:'Assess forecast materialization using only supplied evidence',input_schema:{type:'object',additionalProperties:false,properties:{outcome:{type:'string',enum:['materialized','missed','uncertain']},confidence:{type:'number',minimum:0,maximum:1},actual_event_at:{type:'string'},evidence_refs:{type:'array',items:{type:'string'}},reason:{type:'string'}},required:['outcome','confidence','actual_event_at','evidence_refs','reason']}};
    let calibrated=0,uncertain=0; const results:any[]=[];
    for(const ob of due){
      const fid=ob.payload?.forecast_id; if(!fid){continue;}
      const {data:f}=await db.from('powerhouse_forecasts').select('*').eq('forecast_id',fid).maybeSingle(); if(!f){continue;}
      const system='Beoordeel uitsluitend of de vooraf vastgelegde forecast aantoonbaar is gematerialiseerd binnen de horizon. Gebruik alleen meegeleverde evidence. Kies uncertain als bewijs niet sterk genoeg is. Geen hindsight-bias: verander de forecast niet. Materialized vereist concreet bewijs dat het voorspelde event/probleem/zoekgedrag zichtbaar werd; missed vereist voldoende horizon plus bewijs dat het niet materialiseerde. Geef evidence_refs exact uit de inputbronnen.';
      const calibrationInput={forecast:f,external_signals:(external||[]).filter((x:any)=>x.onderwerp===f.topic_key||String(x.titel||'').toLowerCase().includes(String(f.topic_key||'').toLowerCase().split(' ')[0])).map((x:any)=>({ref:x.url,topic:x.onderwerp,title:x.titel,summary:x.samenvatting,published_at:x.gepubliceerd_op,confidence:x.vertrouwen})).slice(0,20),search_signals:(keywords||[]).filter((x:any)=>String(x.zaadwoord||x.zoekwoord).toLowerCase().includes(String(f.topic_key||'').toLowerCase().split(' ')[0])||String(x.zoekwoord).toLowerCase().includes(String(f.topic_key||'').toLowerCase().split(' ')[0])).map((x:any)=>({ref:`keyword:${x.zoekwoord}`,keyword:x.zoekwoord,volume:x.zoekvolume,competition:x.concurrentie,opportunity:x.kansscore,position:x.positie})).slice(0,15),commercial_outcomes:outcomes||[]};
      let c:any=null;
      let generationProvider=clean(gov.provider);
      let generationModel=clean(gov.model_id);
      let fallbackReason:string|null=null;
      try{
        const ai=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:gov.model_id,max_tokens:1400,system,messages:[{role:'user',content:JSON.stringify(calibrationInput)}],tools:[tool],tool_choice:{type:'tool',name:'calibration'}}),signal:AbortSignal.timeout(45000)});
        const ab:any=await ai.json().catch(()=>({}));
        if(!ai.ok) throw new Error(`AI_${ai.status}:${clean(ab?.error?.message).slice(0,180)}`);
        c=(ab.content||[]).find((x:any)=>x.type==='tool_use'&&x.name==='calibration')?.input;
        if(!c) throw new Error('CALIBRATION_OUTPUT_MISSING');
      }catch(primaryError:any){
        const message=clean(primaryError?.message||primaryError);
        if(!fallbackEligible(message)) throw primaryError;
        const {data:fallbackGov,error:fallbackGovError}=await db.from('brain_ai_governance_registry')
          .select('model_id,provider,approved,lifecycle_status')
          .eq('tenant_id','canonical').eq('use_case_id',FALLBACK_USE_CASE).maybeSingle();
        if(fallbackGovError||!fallbackGov||fallbackGov.approved!==true||fallbackGov.lifecycle_status!=='ACTIVE'||fallbackGov.provider!=='Composio/Groq') throw primaryError;
        c=await callComposioCalibration(db,clean(fallbackGov.model_id),system,calibrationInput);
        generationProvider=clean(fallbackGov.provider);
        generationModel=clean(fallbackGov.model_id);
        fallbackReason=message.slice(0,240);
      }
      if(c.outcome==='uncertain'||Number(c.confidence)<0.6){uncertain++;await db.from('revenue_learning_obligations').update({payload:{...(ob.payload||{}),last_attempt_at:new Date().toISOString(),last_result:'uncertain',last_reason:c.reason,last_confidence:c.confidence,generation_provider:generationProvider,generation_model:generationModel,fallback_reason:fallbackReason},due_at:new Date(Date.now()+7*86400000).toISOString(),updated_at:new Date().toISOString()}).eq('tenant_id','canonical').eq('obligation_id',ob.obligation_id);results.push({forecast_id:fid,outcome:'uncertain'});continue;}
      const y=c.outcome==='materialized'?1:0;
      const brier=Number((await db.rpc('powerhouse_forecast_brier',{p_probability:f.probability,p_outcome:y})).data||0);
      const eventAt=y===1&&c.actual_event_at?new Date(c.actual_event_at):null;
      const actualLead=eventAt&&Number.isFinite(eventAt.getTime())?Math.round(((eventAt.getTime()-new Date(f.created_at).getTime())/86400000)*10)/10:null;
      const attributedRevenue=(outcomes||[]).reduce((s:number,o:any)=>s+Number(o.revenue_eur||0),0);
      const {error:ce}=await db.from('powerhouse_forecast_calibration').insert({forecast_id:fid,measured_at:new Date().toISOString(),actual_event_occurred:y===1,actual_event_at:eventAt?.toISOString()||null,timing_error_days:actualLead==null?null:actualLead-Number(f.expected_lead_days||0),probability_error:brier,first_mover_advantage_score:y===1?f.first_mover_score:0,content_lift:null,revenue_influence:attributedRevenue>0?attributedRevenue:null,evidence:{reason:c.reason,evidence_refs:c.evidence_refs,calibration_confidence:c.confidence,contract:'predictive-first-mover-intelligence-v1',generation_provider:generationProvider,generation_model:generationModel,fallback_reason:fallbackReason},outcome_value:y,brier_component:brier,actual_lead_days:actualLead,attribution_confidence:0,revenue_eur:0,content_ids:[]}); if(ce) throw ce;
      await db.from('powerhouse_forecasts').update({status:y===1?'materialized':'expired',materialized_at:y===1?(eventAt?.toISOString()||new Date().toISOString()):null,outcome:{outcome:c.outcome,calibration_confidence:c.confidence,brier_component:brier,evidence_refs:c.evidence_refs},updated_at:new Date().toISOString()}).eq('forecast_id',fid);
      await db.from('revenue_learning_obligations').update({status:'CLOSED',payload:{...(ob.payload||{}),closed_at:new Date().toISOString(),outcome:c.outcome,brier_component:brier,evidence_refs:c.evidence_refs,generation_provider:generationProvider,generation_model:generationModel,fallback_reason:fallbackReason},updated_at:new Date().toISOString()}).eq('tenant_id','canonical').eq('obligation_id',ob.obligation_id);
      calibrated++;results.push({forecast_id:fid,outcome:c.outcome,brier_component:brier,actual_lead_days:actualLead});
    }
    await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-forecast-calibrator',soort:'calibration-run',status:'ok',detail:`due=${due.length}; calibrated=${calibrated}; uncertain=${uncertain}`,gegevens:{contract:'predictive-first-mover-intelligence-v1',results}});
    return json({ok:true,due:due.length,calibrated,uncertain,results});
  }catch(e:any){
    const detail=String(e?.message||e).slice(0,500);
    const providerDegraded=/^AI_(?:401|402|403|429|5\\d\\d):/.test(detail)||/^AI_400:.*credit balance is too low/i.test(detail);
    try{await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-forecast-calibrator',soort:'calibration-run',status:'fout',detail:detail.slice(0,400),gegevens:{contract:'predictive-first-mover-intelligence-v1',state:providerDegraded?'DEGRADED_AI_PROVIDER':'ERROR',retryable:providerDegraded}});}catch{}
    if(providerDegraded) return json({ok:false,state:'DEGRADED_AI_PROVIDER',error:'AI_PROVIDER_UNAVAILABLE',retryable:true},200);
    return json({ok:false,error:detail},500);
  }
});