import { createClient } from 'npm:@supabase/supabase-js@2';

const CHANNELS = [
  'email_newsletter','linkedin_personal','linkedin_company',
  'linkedin_article_personal','linkedin_article_company','instagram_company','blog'
] as const;
const HARD_SOCIAL = new Set(['linkedin_personal','linkedin_company','instagram_company']);
const EXECUTABLE = new Set(['linkedin_personal','linkedin_company','instagram_company','blog']);
const PERSONAL_CONTRACT='arthur-personal-linkedin-identity-v4';
const PERSONAL_GATE='channel-identity-hard-gate-v3';
const PERSONAL_CHANNEL='6a70381699afb44349f0fb35';
const INSTAGRAM_CHANNEL='6a70384d99afb44349f0fba9';
const VERSION='v9-seven-channel-consolidated';

const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function digest(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}

async function callAI(key:string,model:string,system:string,user:unknown,tool:any,max_tokens=3000){
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model,max_tokens,system,messages:[{role:'user',content:JSON.stringify(user)}],tools:[tool],tool_choice:{type:'tool',name:tool.name}})});
  const b=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(`AI_${r.status}:${clean(b?.error?.message).slice(0,220)}`);
  const t=(b.content||[]).find((x:any)=>x.type==='tool_use'&&x.name===tool.name);
  if(!t?.input)throw new Error('AI_TOOL_OUTPUT_MISSING');
  return t.input;
}

function validPersonalSource(r:any){
  const e=r?.evidence||{};
  const lineage=Array.isArray(e.source_lineage)?e.source_lineage.length>0:!!e.source_lineage;
  return r?.target_channel==='linkedin_personal'&&e.identity_contract===PERSONAL_CONTRACT&&e.identity_gate_version===PERSONAL_GATE&&clean(e.content_id)&&lineage&&e.arthur_anchor_verified===true&&e.first_person_claims_verified===true&&e.personal_life_topic===true&&e.business_topic===false&&e.corporate_voice===false&&e.company_page_interchangeable===false&&e.forced_business_moral===false&&(e.sensitive_private_detail!==true||e.sensitive_private_approval===true);
}

function recommendationFor(recs:any[],channel:string){
  return [...(recs||[])].filter(r=>!clean(r?.status)||clean(r?.status)==='suggested').sort((a,b)=>{
    const score=(r:any)=>num(r?.priority)+(clean(r?.target_channel)===channel?100:0)+(clean(r?.topic_key)===channel?50:0);
    return score(b)-score(a);
  })[0]||null;
}

function fallbackDecision(channel:string,recs:any[],personalSource:any){
  if(channel==='linkedin_personal'&&!personalSource){
    return {channel,decision:'publish',state:'blocked',priority:100,confidence:1,topic_key:'personal-source-required',rationale:'HARD_SOCIAL BLOCKED: canonieke Arthur-persoonlijke bron/evidence-lineage ontbreekt; zakelijke fallback verboden.',scheduled_hour_local:11,content_brief:'',forecast_id:'',prediction_mode:'none',prediction_rationale:'Persoonlijke bron ontbreekt.',plan_repaired:true,decision_source:'identity-gate-block',fallback_recommendation_id:null,recovery:'PERSONAL_IDENTITY_SOURCE_REQUIRED'};
  }
  const rec=recommendationFor(recs,channel);
  if(HARD_SOCIAL.has(channel)){
    return {channel,decision:'publish',state:'decided',priority:Math.max(70,num(rec?.priority)),confidence:rec?.priority?Math.min(.9,Math.max(.6,num(rec.priority)/100)):.55,topic_key:clean(rec?.topic_key)||channel,rationale:rec?`Deterministische HARD_SOCIAL recovery via recommendation ${rec.recommendation_id}.`:'HARD_SOCIAL publication obligation; geen stille HOLD/SKIP toegestaan.',scheduled_hour_local:channel==='instagram_company'?14:13,content_brief:clean(rec?.reason)||`Maak veilige kanaaleigen content voor ${channel}.`,forecast_id:'',prediction_mode:'none',prediction_rationale:'HARD_SOCIAL recovery blijft evidence-bound en fail-closed bij ontbrekende uitvoerprerequisites.',plan_repaired:true,decision_source:'hard-social-recovery',fallback_recommendation_id:rec?.recommendation_id||null,recovery:null};
  }
  if(channel==='blog'&&rec){
    return {channel,decision:'publish',state:'decided',priority:num(rec.priority),confidence:Math.min(.85,Math.max(.55,num(rec.priority)/100)),topic_key:clean(rec.topic_key),rationale:`Deterministische adaptive recovery via recommendation ${rec.recommendation_id}.`,scheduled_hour_local:12,content_brief:clean(rec.reason),forecast_id:'',prediction_mode:'none',prediction_rationale:'Evidence-bound fallback.',plan_repaired:true,decision_source:'deterministic-recommendation-fallback',fallback_recommendation_id:rec.recommendation_id,recovery:null};
  }
  return {channel,decision:'hold',state:'decided',priority:0,confidence:0,topic_key:'',rationale:'Adaptive lane HOLD: geen veilige uitvoerbare evidence-led publicatiebeslissing.',scheduled_hour_local:9,content_brief:'',forecast_id:'',prediction_mode:'none',prediction_rationale:'Geen veilige uitvoerbare recovery.',plan_repaired:true,decision_source:'adaptive-capability-hold',fallback_recommendation_id:null,recovery:null};
}

function normalizePlan(rawDecisions:any[],predictiveById:Map<string,any>,recs:any[],personalSource:any){
  const source=Array.isArray(rawDecisions)?rawDecisions:[];
  const byChannel=new Map<string,any>(); const invalid:string[]=[];
  for(const item of source){const channel=clean(item?.channel);if(!CHANNELS.includes(channel as any)){invalid.push(`unknown:${channel||'missing'}`);continue;}if(byChannel.has(channel)){invalid.push(`duplicate:${channel}`);continue;}byChannel.set(channel,item);}
  const decisions=CHANNELS.map(channel=>{
    const item=byChannel.get(channel);
    if(!item)return fallbackDecision(channel,recs,personalSource);
    const forecastId=clean(item.forecast_id);
    if(forecastId&&!predictiveById.has(forecastId))return fallbackDecision(channel,recs,personalSource);
    let decision=['publish','skip','hold'].includes(item.decision)?item.decision:'hold';
    let state='decided';
    let recovery:string|null=null;
    if(HARD_SOCIAL.has(channel)&&decision!=='publish') decision='publish';
    if(channel==='linkedin_personal'&&!personalSource){decision='publish';state='blocked';recovery='PERSONAL_IDENTITY_SOURCE_REQUIRED';}
    if(decision==='publish'&&!EXECUTABLE.has(channel)){decision='hold';state='decided';}
    return {...item,channel,decision,state,priority:num(item.priority),confidence:num(item.confidence),topic_key:clean(item.topic_key),rationale:clean(item.rationale)||'Evidence-led Powerhouse besluit.',scheduled_hour_local:Math.min(18,Math.max(9,num(item.scheduled_hour_local)||9)),content_brief:clean(item.content_brief),forecast_id:forecastId,prediction_mode:['none','reactive','anticipatory','category_creation'].includes(item.prediction_mode)?item.prediction_mode:'none',prediction_rationale:clean(item.prediction_rationale),plan_repaired:false,decision_source:'ai-plan',fallback_recommendation_id:null,recovery};
  });
  return {decisions,repaired:invalid.length>0||decisions.some((x:any)=>x.plan_repaired),invalid,raw_count:source.length};
}

async function obligationState(db:any,runDate:string,channel:string,status:string,evidence:any,error:string|null=null){
  const {error:rpcError}=await db.rpc('record_content_publication_state',{p_tenant_id:'canonical',p_publication_date:runDate,p_channel:channel,p_status:status,p_evidence:evidence||{},p_error:error});
  if(rpcError)console.error('PUBLICATION_OBLIGATION_STATE_FAILED',channel,status,rpcError.message);
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
  let body:any={}; try{body=await req.json()}catch{}
  const runDate=clean(body.runDate)||localDate(); let stage='load-context';
  try{
    await db.rpc('sync_content_publication_obligations',{p_from:runDate,p_to:runDate});
    const [{data:run},{data:recs},{data:rules},{data:perf},{data:gov},{data:existing},{data:predictive}]=await Promise.all([
      db.from('powerhouse_daily_runs').select('*').eq('run_date',runDate).maybeSingle(),
      db.from('powerhouse_content_recommendations').select('recommendation_id,topic_key,target_channel,recommendation_type,priority,reason,evidence,status').eq('run_date',runDate).order('priority',{ascending:false}).limit(30),
      db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status').eq('status','actief').order('vertrouwen',{ascending:false}).limit(30),
      db.from('bg_post_prestatie').select('*').order('bijgewerkt_op',{ascending:false}).limit(30),
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle(),
      db.from('powerhouse_channel_decisions').select('channel,decision,state,priority,topic_key,delivery_ref,delivery_evidence').eq('run_date',runDate),
      db.from('powerhouse_first_mover_queue').select('*').order('action_score',{ascending:false}).limit(12)
    ]);
    stage='validate-context';
    if(!run)throw new Error('DAILY_RUN_MISSING');
    if(!gov||gov.approved!==true||gov.lifecycle_status!=='ACTIVE'||gov.provider!=='Anthropic')throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey=clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data); if(!apiKey)throw new Error('AI_KEY_UNAVAILABLE');
    const predictiveById=new Map((predictive||[]).map((p:any)=>[p.forecast_id,p]));
    const personalSource=(recs||[]).filter(validPersonalSource)[0]||null;
    const repairable=(existing||[]).length!==7||((existing||[]).every((r:any)=>!r.delivery_ref));

    if(repairable){
      stage='plan-ai';
      const decisionTool={name:'daily_plan',description:'Exact zeven evidence-led kanaalbesluiten',input_schema:{type:'object',additionalProperties:false,properties:{decisions:{type:'array',minItems:7,maxItems:7,items:{type:'object',additionalProperties:false,properties:{channel:{type:'string',enum:CHANNELS},decision:{type:'string',enum:['publish','skip','hold']},priority:{type:'number',minimum:0,maximum:100},confidence:{type:'number',minimum:0,maximum:1},topic_key:{type:'string'},rationale:{type:'string'},scheduled_hour_local:{type:'integer',minimum:9,maximum:18},content_brief:{type:'string'},forecast_id:{type:'string'},prediction_mode:{type:'string',enum:['none','reactive','anticipatory','category_creation']},prediction_rationale:{type:'string'}},required:['channel','decision','priority','confidence','topic_key','rationale','scheduled_hour_local','content_brief','forecast_id','prediction_mode','prediction_rationale']}}},required:['decisions']}};
      let aiPlan:any={decisions:[]};
      try{aiPlan=await callAI(apiKey,gov.model_id,'Je bent het canonieke Brein/Powerhouse. Beslis voor exact zeven kanalen. De drie HARD_SOCIAL lanes linkedin_personal, linkedin_company en instagram_company zijn dagelijkse verplichtingen: kies daar PUBLISH; ontbrekende prerequisites worden downstream zichtbaar BLOCKED, nooit stil HOLD/SKIP. Arthur persoonlijk blijft strikt persoonlijk volgens identity v4; zonder verified persoonlijke bron mag geen zakelijke fallback ontstaan. Instagram is Mira/bedrijfsgeheugen en vereist downstream geverifieerde media. Adaptive lanes mogen evidence-led HOLD/SKIP. Verzin geen feiten of ervaringen.',{run_date:runDate,daily_run:run,recommendations:recs||[],verified_personal_source:personalSource,predictive_candidates:predictive||[],recent_performance:perf||[],active_rules:rules||[],executor_capabilities:{linkedin_personal:!!personalSource,linkedin_company:true,instagram_company:true,blog:true,email_newsletter:false,linkedin_article_personal:false,linkedin_article_company:false}},decisionTool,3800);}catch(aiError){console.error('ORCHESTRATOR_PLAN_AI_RECOVERY',String(aiError?.message||aiError));}
      stage='normalize-plan'; const plan=normalizePlan(aiPlan?.decisions,predictiveById,recs||[],personalSource);
      stage='write-decisions';
      for(const d of plan.decisions as any[]){
        const hh=String(d.scheduled_hour_local).padStart(2,'0'); const pf=d.forecast_id?predictiveById.get(d.forecast_id):null;
        const evidence={content_brief:d.content_brief,decision_engine:VERSION,decision_source:d.decision_source,plan_raw_count:plan.raw_count,forecast_id:d.forecast_id||null,prediction_mode:d.prediction_mode,prediction_rationale:d.prediction_rationale,forecast_action_score:pf?.action_score??null,forecast_probability:pf?.probability??null,forecast_confidence:pf?.confidence??null,plan_repaired:plan.repaired,plan_invalid_entries:plan.invalid,fallback_recommendation_id:d.fallback_recommendation_id||null,hard_social:HARD_SOCIAL.has(d.channel),recovery:d.recovery||null,personal_identity_contract:d.channel==='linkedin_personal'?PERSONAL_CONTRACT:null,personal_source_recommendation_id:d.channel==='linkedin_personal'?personalSource?.recommendation_id||null:null,instagram_channel_id:d.channel==='instagram_company'?INSTAGRAM_CHANNEL:null,mira_required:d.channel==='instagram_company'?true:null};
        const {error}=await db.from('powerhouse_channel_decisions').upsert({run_date:runDate,channel:d.channel,decision:d.decision,state:d.state||'decided',priority:d.priority,confidence:d.confidence,topic_key:d.topic_key,rationale:d.rationale,scheduled_for:`${runDate}T${hh}:00:00+02:00`,delivery_evidence:evidence,source_recommendation_ids:(recs||[]).map((x:any)=>x.recommendation_id),updated_at:new Date().toISOString()});
        if(error)throw new Error(`DECISION_WRITE:${error.message}`);
        if(d.state==='blocked')await obligationState(db,runDate,d.channel,'BLOCKED',{orchestrator:VERSION,recovery:d.recovery},d.recovery);
      }
    }

    stage='assert-seven';
    const {data:allDecisions,error:countError}=await db.from('powerhouse_channel_decisions').select('channel,decision,state').eq('run_date',runDate);
    if(countError)throw new Error(`DECISION_COUNT_READ:${countError.message}`);
    if((allDecisions||[]).length!==7)throw new Error(`SEVEN_DECISIONS_REQUIRED:${(allDecisions||[]).length}`);

    stage='select-pending';
    const {data:pending,error:pendingError}=await db.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate).eq('decision','publish').eq('state','decided').order('priority',{ascending:false}).limit(1).maybeSingle();
    if(pendingError)throw new Error(`PENDING_READ:${pendingError.message}`);
    if(!pending)return json({ok:true,runDate,decision_count:7,generated:false,reason:'NO_PENDING_ARTIFACT',personal_source_ready:!!personalSource,predictive_candidates:(predictive||[]).length});

    if(pending.channel==='linkedin_personal'&&!personalSource){
      await db.from('powerhouse_channel_decisions').update({state:'blocked',delivery_evidence:{...(pending.delivery_evidence||{}),recovery:'PERSONAL_IDENTITY_SOURCE_REQUIRED',personal_fail_closed:true},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',pending.channel);
      await obligationState(db,runDate,pending.channel,'BLOCKED',{orchestrator:VERSION,recovery:'PERSONAL_IDENTITY_SOURCE_REQUIRED'},'PERSONAL_IDENTITY_SOURCE_REQUIRED');
      return json({ok:true,runDate,decision_count:7,generated:false,channel:pending.channel,reason:'PERSONAL_IDENTITY_SOURCE_MISSING_BLOCKED'});
    }

    stage='artifact-ai';
    const selectedForecast=pending.delivery_evidence?.forecast_id?predictiveById.get(pending.delivery_evidence.forecast_id):null;
    const artifactTool={name:'content_artifact',description:'Definitieve kanaaleigen content',input_schema:{type:'object',additionalProperties:false,properties:{title:{type:'string'},body:{type:'string'},cta:{type:'string'},artifact_type:{type:'string',enum:['linkedin_post','instagram_post','blog']},hook_type:{type:'string'},focus_keyword:{type:'string'},meta_description:{type:'string'}},required:['title','body','cta','artifact_type','hook_type','focus_keyword','meta_description']}};
    const lengths:any={linkedin_personal:'80-300 woorden',linkedin_company:'100-300 woorden',instagram_company:'40-180 woorden',blog:'900-1600 woorden'};
    const brief=clean(pending.delivery_evidence?.content_brief)||clean(pending.rationale);
    const instruction=pending.channel==='linkedin_personal'?'Arthur persoonlijk: uitsluitend verified_personal_source; geen business/Bedrijfsgeheugen/consultancy/AI-data/digitalisering, geen verzonnen eerste-persoonsfeit.':pending.channel==='instagram_company'?'Instagram Bedrijfsgeheugen/Mira: schrijf alleen caption/CTA. Verzin geen afbeelding of asset-URL. Publisher moet een echte Mira media asset apart verifiëren.':'LinkedIn bedrijf/blog: merk- en evidence-gedreven, zonder verzonnen claims.';
    const artifact=await callAI(apiKey,gov.model_id,`Schrijf definitieve kanaaleigen content. ${instruction}`,{channel:pending.channel,length:lengths[pending.channel],brief,rationale:pending.rationale,recommendations:pending.channel==='linkedin_personal'?[personalSource]:recs||[],verified_personal_source:pending.channel==='linkedin_personal'?personalSource:null,forecast_context:selectedForecast||null,active_rules:rules||[]},artifactTool,pending.channel==='blog'?4500:2400);

    stage='write-artifact';
    const contentKey=`${runDate}:${pending.channel}`; const hash=await digest(clean(artifact.body)); let identityEvidence:any=null;
    if(pending.channel==='linkedin_personal'){
      const e=personalSource.evidence||{}; identityEvidence={content_id:clean(e.content_id)||contentKey,calendar_date:runDate,channel_id:PERSONAL_CHANNEL,channel_kind:'linkedin_personal',identity_contract:PERSONAL_CONTRACT,identity_gate_version:PERSONAL_GATE,source_lineage:e.source_lineage,arthur_anchor_verified:true,first_person_claims_verified:true,personal_life_topic:true,business_topic:false,corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false,sensitive_private_detail:e.sensitive_private_detail===true,sensitive_private_approval:e.sensitive_private_approval===true,prediction_lineage_present:true,prior_prediction_decision_id:`decision:${runDate}:linkedin_personal`,publication_intent:'publish',final_text_hash:hash};
    }
    const generationEvidence:any={model:gov.model_id,orchestrator:VERSION,hook_type:artifact.hook_type,focus_keyword:artifact.focus_keyword,meta_description:artifact.meta_description,recommendation_ids:(recs||[]).map((x:any)=>x.recommendation_id),forecast_id:selectedForecast?.forecast_id||null,prediction_mode:selectedForecast?.prediction_mode||'none',identity_gate_evidence:identityEvidence};
    if(pending.channel==='instagram_company') generationEvidence.instagram_media={mira_required:true,media_gate:'Mira',assetUrl:null,mediaKind:null,status:'awaiting_verified_asset',channel_id:INSTAGRAM_CHANNEL};
    const {error:artifactError}=await db.from('powerhouse_content_artifacts').upsert({run_date:runDate,channel:pending.channel,artifact_type:artifact.artifact_type,title:artifact.title,body:artifact.body,cta:artifact.cta,content_brief:brief,generation_evidence:generationEvidence,status:'content_ready',updated_at:new Date().toISOString()});
    if(artifactError)throw new Error(`ARTIFACT_WRITE:${artifactError.message}`);
    const {error:decisionError}=await db.from('powerhouse_channel_decisions').update({state:'content_ready',content_key:contentKey,delivery_evidence:{...(pending.delivery_evidence||{}),identity_gate_evidence:identityEvidence,instagram_media:generationEvidence.instagram_media||null},updated_at:new Date().toISOString()}).eq('run_date',runDate).eq('channel',pending.channel).eq('state','decided');
    if(decisionError)throw new Error(`DECISION_STATE_WRITE:${decisionError.message}`);
    await obligationState(db,runDate,pending.channel,'GENERATED',{orchestrator:VERSION,content_key:contentKey,final_text_hash:hash});
    return json({ok:true,runDate,decision_count:7,generated:true,channel:pending.channel,title:artifact.title,personal_identity_evidence_bound:!!identityEvidence,instagram_media_required:pending.channel==='instagram_company'});
  }catch(e:any){
    const message=String(e?.message||e).slice(0,500);
    try{const {error:healthError}=await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-content-orchestrator',soort:'edge-function',status:'fout',detail:`${stage}:${message}`.slice(0,400),gegevens:{runDate,version:VERSION,contract:PERSONAL_CONTRACT,stage}});if(healthError)console.error('ORCHESTRATOR_HEALTH_WRITE_FAILED',healthError.message);}catch(writeError:any){console.error('ORCHESTRATOR_HEALTH_WRITE_THROW',String(writeError?.message||writeError));}
    console.error('powerhouse-content-orchestrator',stage,message);
    return json({ok:false,error:message,stage,runDate,version:VERSION},500);
  }
});
