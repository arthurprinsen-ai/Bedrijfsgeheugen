const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();
const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const arr=(v:unknown)=>Array.isArray(v)?v:[];
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');
const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const headers={apikey:service,authorization:`Bearer ${service}`,'content-type':'application/json',accept:'application/json'};
const cors={'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'GET,POST,OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const fail=(message:string):never=>{throw new Error(`BAD_REQUEST:${message}`)};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request,scope:string){
  const raw=clean(req.headers.get('x-powerhouse-token'));if(!raw||!base||!service)return false;
  const hash=await sha256(raw);const r=await fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}&active=eq.true&select=token_hash,scopes&limit=1`,{headers});if(!r.ok)return false;
  const row=(await r.json())?.[0];if(!row||!arr(row.scopes).includes(scope))return false;
  fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}`,{method:'PATCH',headers:{...headers,prefer:'return=minimal'},body:JSON.stringify({last_used_at:new Date().toISOString()})}).catch(()=>{});return true;
}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}});const text=await r.text();let data:any=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw new Error(`REST_${r.status}:${String(text).slice(0,500)}`);return data}
const limitOf=(u:URL,fallback=20)=>Math.max(1,Math.min(100,num(u.searchParams.get('limit'),fallback)));
const bodyDate=(v:unknown,name:string,required=false)=>{const s=clean(v);if(!s){if(required)fail(`${name} required`);return null}const t=Date.parse(s);if(!Number.isFinite(t))fail(`${name} invalid`);return new Date(t).toISOString()};
const bodyUuid=(v:unknown,name:string,required=false)=>{const s=clean(v);if(!s){if(required)fail(`${name} required`);return null}if(!uuid.test(s))fail(`${name} invalid`);return s};
const nonnegative=(v:unknown,name:string)=>{if(v===undefined||v===null||v==='')return null;const n=Number(v);if(!Number.isFinite(n)||n<0)fail(`${name} must be NONNEGATIVE`);return n};

async function commandCenter(limit=20){
  return rest(`powerhouse_revenue_command_center_snapshot_v1?select=*&order=revenue_rank.asc&limit=${limit}`);
}
async function research(limit=30){
  return rest(`powerhouse_revenue_command_center_snapshot_v1?research_reason=not.is.null&select=*&order=revenue_rank.asc&limit=${limit}`);
}
async function accounts(limit=30){
  const rows=arr(await rest('powerhouse_revenue_command_center_snapshot_v1?company_key=not.is.null&select=company_key,person_key,person_name,role,account_thesis,recommended_account_move,expected_commercial_value_eur,buying_window_score,buying_window_confidence,prediction_win,prediction_confidence,why_now,revenue_rank&order=revenue_rank.asc&limit=100'));
  const byCompany=new Map<string,any>();
  for(const row of rows){
    const key=clean(row.company_key);if(!key)continue;
    const current=byCompany.get(key)||{company_key:key,account_thesis:row.account_thesis||null,recommended_account_move:row.recommended_account_move||null,expected_account_value_eur:0,max_buying_window_score:0,max_buying_window_confidence:0,max_prediction_win:0,prediction_confidence:0,people:[],why_now:row.why_now||null,best_revenue_rank:num(row.revenue_rank,9999)};
    current.expected_account_value_eur+=Math.max(0,num(row.expected_commercial_value_eur,0));
    current.max_buying_window_score=Math.max(current.max_buying_window_score,num(row.buying_window_score,0));
    current.max_buying_window_confidence=Math.max(current.max_buying_window_confidence,num(row.buying_window_confidence,0));
    current.max_prediction_win=Math.max(current.max_prediction_win,num(row.prediction_win,0));
    current.prediction_confidence=Math.max(current.prediction_confidence,num(row.prediction_confidence,0));
    current.best_revenue_rank=Math.min(current.best_revenue_rank,num(row.revenue_rank,9999));
    if(row.person_key&&!current.people.some((p:any)=>p.person_key===row.person_key))current.people.push({person_key:row.person_key,person_name:row.person_name||null,role:row.role||null});
    byCompany.set(key,current);
  }
  return [...byCompany.values()].sort((a,b)=>b.expected_account_value_eur-a.expected_account_value_eur||a.best_revenue_rank-b.best_revenue_rank).slice(0,limit);
}
async function modelHealth(){return rest('powerhouse_model_health_v1?select=*&order=sample_size.desc')}
async function attribution(limit=50){return rest(`powerhouse_revenue_attribution_v1?select=*&order=occurred_at.desc&limit=${limit}`)}
async function experiments(limit=50){return rest(`powerhouse_experiment_learning_v2?select=*&order=calendar_date.desc.nullslast&limit=${limit}`)}
async function marketTruthHealth(){return arr(await rest('powerhouse_market_truth_health_v1?select=*&limit=1'))[0]||null}
async function ensureForecastLineage(date:string){return rest('rpc/powerhouse_ensure_commercial_progression_forecasts_v1',{method:'POST',body:JSON.stringify({p_run_date:date})})}
async function refreshCommandCenterSnapshot(){return rest('rpc/powerhouse_refresh_revenue_intelligence_snapshot_v1',{method:'POST',body:'{}'})}
async function matureMarketTruth(){return rest('rpc/powerhouse_mature_experiment_assignments_v1',{method:'POST',body:'{}'})}
async function writeMarketTruthDaily(date:string){return rest('rpc/powerhouse_market_truth_daily_v1',{method:'POST',body:JSON.stringify({p_run_date:date})})}

async function assignExperiment(input:unknown){
  const b=obj(input);const experimentKey=clean(b.experimentKey);const subjectKey=clean(b.subjectKey);const opportunityKey=clean(b.opportunityKey)||null;const modelVersion=clean(b.modelVersion);
  if(!experimentKey)fail('experimentKey required');if(!subjectKey)fail('subjectKey required');if(!modelVersion)fail('modelVersion required');
  const horizon=bodyDate(b.measurementHorizonEnd,'measurementHorizonEnd',true)!;if(Date.parse(horizon)<=Date.now())fail('measurementHorizonEnd must be in the future');
  const eligibilitySnapshot=obj(b.eligibilitySnapshot);const dedupeKey=clean(b.dedupeKey)||null;
  return rest('rpc/powerhouse_assign_experiment_v1',{method:'POST',body:JSON.stringify({p_experiment_key:experimentKey,p_subject_key:subjectKey,p_opportunity_key:opportunityKey,p_eligibility_snapshot:eligibilitySnapshot,p_measurement_horizon_end:horizon,p_model_version:modelVersion,p_assignment_arm:null,p_dedupe_key:dedupeKey})});
}
async function linkExperiment(input:unknown){
  const b=obj(input);const assignmentId=bodyUuid(b.assignmentId,'assignmentId',true)!;const actionId=bodyUuid(b.actionId,'actionId',true)!;
  return rest('rpc/powerhouse_link_experiment_action_v1',{method:'POST',body:JSON.stringify({p_assignment_id:assignmentId,p_action_id:actionId})});
}
async function recordEconomics(input:unknown){
  const b=obj(input);const dedupeKey=clean(b.dedupeKey);const actionId=bodyUuid(b.actionId,'actionId',true)!;if(!dedupeKey)fail('dedupeKey required');
  const providerCostEur=nonnegative(b.providerCostEur,'providerCostEur');const externalCostEur=nonnegative(b.externalCostEur,'externalCostEur');const humanMinutes=nonnegative(b.humanMinutes,'humanMinutes');
  if(providerCostEur===null&&externalCostEur===null&&humanMinutes===null)fail('at least one observed economics value required');
  const observedAt=bodyDate(b.observedAt,'observedAt')||new Date().toISOString();const evidence=obj(b.evidence);
  return rest('rpc/powerhouse_record_action_economics_v1',{method:'POST',body:JSON.stringify({p_dedupe_key:dedupeKey,p_action_id:actionId,p_provider_cost_eur:providerCostEur,p_external_cost_eur:externalCostEur,p_human_minutes:humanMinutes,p_evidence:evidence,p_observed_at:observedAt})});
}
async function recordFeedback(input:unknown){
  const b=obj(input);const dedupeKey=clean(b.dedupeKey);const feedbackType=clean(b.feedbackType);const allowed=['approve','edit','skip','cancel','override','alternative_action'];
  if(!dedupeKey)fail('dedupeKey required');if(!allowed.includes(feedbackType))fail('feedbackType must be approve, edit, skip, cancel, override or alternative_action');
  const actionId=bodyUuid(b.actionId,'actionId')||null;const opportunityKey=clean(b.opportunityKey)||null;if(!actionId&&!opportunityKey)fail('actionId or opportunityKey required');
  const recommendedVariant=clean(b.recommendedVariant)||null;const actualVariant=clean(b.actualVariant)||null;const alternativeAction=clean(b.alternativeAction)||null;
  if(feedbackType==='edit'&&!actualVariant)fail('actualVariant required for edit feedback');if(feedbackType==='alternative_action'&&!alternativeAction)fail('alternativeAction required for alternative_action feedback');
  const observedAt=bodyDate(b.observedAt,'observedAt')||new Date().toISOString();
  return rest('rpc/powerhouse_record_human_feedback_v1',{method:'POST',body:JSON.stringify({p_dedupe_key:dedupeKey,p_feedback_type:feedbackType,p_action_id:actionId,p_opportunity_key:opportunityKey,p_subject_key:clean(b.subjectKey)||null,p_reason:clean(b.reason)||null,p_recommended_variant:recommendedVariant,p_actual_variant:actualVariant,p_alternative_action:alternativeAction,p_evidence:obj(b.evidence),p_observed_at:observedAt})});
}

async function snapshotStatus(){
  const rows=arr(await rest('powerhouse_revenue_command_center_snapshot_v1?select=refreshed_at&order=refreshed_at.desc&limit=1').catch(()=>[]));
  const refreshedAt=clean(rows[0]?.refreshed_at);const ts=refreshedAt?Date.parse(refreshedAt):NaN;
  const snapshot_age_minutes=Number.isFinite(ts)?Math.max(0,(Date.now()-ts)/60000):null;
  const snapshot_stale=snapshot_age_minutes===null||snapshot_age_minutes>30;
  return{snapshot_refreshed_at:refreshedAt||null,snapshot_age_minutes,snapshot_stale};
}
async function healthReadback(){
  const [rows,snapshot]=await Promise.all([
    rest('powerhouse_revenue_intelligence_health_v1?select=*&limit=1'),
    snapshotStatus()
  ]);
  const baseHealth=arr(rows)[0]||{structural_lineage_gaps:0,research_queue_count:0,model_health_segments:0,model_watch_segments:0,intelligence_state:'completed'};
  return{...baseHealth,...snapshot};
}
async function dailyIntelligence(runDate?:string){
  const date=clean(runDate)||new Date().toISOString().slice(0,10);
  const forecastBridge=await ensureForecastLineage(date);
  const snapshotRefresh=await refreshCommandCenterSnapshot();
  const marketTruthMaturity=await matureMarketTruth();
  const marketTruthLearning=await writeMarketTruthDaily(date);
  const health=await healthReadback();
  const structural_lineage_gaps=num(health.structural_lineage_gaps,0);const research_queue_count=num(health.research_queue_count,0);const model_health_segments=num(health.model_health_segments,0);const model_watch_segments=num(health.model_watch_segments,0);const snapshot_stale=health.snapshot_stale===true;const state=structural_lineage_gaps>0||snapshot_stale?'degraded':'completed';
  const existing=await rest(`powerhouse_daily_runs?run_date=eq.${date}&select=*&limit=1`).catch(()=>[]);const prior=arr(existing)[0]||{};
  const evidence={...(prior.evidence||{}),revenue_intelligence_loop:{version:'1.3.0',structural_lineage_gaps,research_queue_count,model_health_segments,model_watch_segments,identity_gaps:num(health.identity_gaps,0),forecast_lineage_gaps:num(health.forecast_lineage_gaps,0),runtime_errors:num(health.runtime_errors,0),forecast_bridge:forecastBridge,snapshot_refresh:snapshotRefresh,snapshot_refreshed_at:health.snapshot_refreshed_at||null,snapshot_age_minutes:health.snapshot_age_minutes,snapshot_stale,market_truth_maturity:marketTruthMaturity,market_truth_learning:marketTruthLearning,verified_at:new Date().toISOString()}};
  const row={run_date:date,dedupe_key:prior.dedupe_key||`daily:${date}`,state,action_count:num(prior.action_count,0),recommendation_count:num(prior.recommendation_count,0),evidence,completed_at:state==='completed'?(prior.completed_at||new Date().toISOString()):prior.completed_at||null,updated_at:new Date().toISOString()};
  await rest('powerhouse_daily_runs?on_conflict=run_date',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)});
  return{runDate:date,state,structural_lineage_gaps,research_queue_count,model_health_segments,model_watch_segments,forecastBridge,snapshotRefresh,marketTruthMaturity,marketTruthLearning,snapshot_age_minutes:health.snapshot_age_minutes,snapshot_stale};
}

Deno.serve(async(req:Request)=>{try{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const u=new URL(req.url);const route=u.pathname.split('/').filter(Boolean).pop()||'health';
  const scopes:Record<string,string>={health:'health','command-center':'actions',accounts:'opportunities',research:'learning','model-health':'learning',attribution:'learning',experiments:'learning','experiment-assign':'learning','experiment-link':'learning',economics:'learning',feedback:'learning','market-truth-health':'learning',daily:'daily'};const scope=scopes[route]||'learning';
  if(!await authorized(req,scope))return json({ok:false,error:'UNAUTHORIZED'},401);
  if(route==='health'&&req.method==='GET'){const readback=await healthReadback();return json({ok:true,runtime:'powerhouse-revenue-intelligence',version:'1.3.0',canonicalCore:'powerhouse-runtime',parallelBrain:false,snapshotBacked:true,commandCenterV2:true,accountIntelligence:true,researchFailClosed:true,modelMonitoring:true,forecastBridge:true,marketTruthIngress:true,db:true,readback,at:new Date().toISOString()})}
  if(route==='command-center'&&req.method==='GET')return json({ok:true,items:await commandCenter(limitOf(u,20))});
  if(route==='accounts'&&req.method==='GET')return json({ok:true,items:await accounts(limitOf(u,30))});
  if(route==='research'&&req.method==='GET')return json({ok:true,items:await research(limitOf(u,30))});
  if(route==='model-health'&&req.method==='GET')return json({ok:true,items:await modelHealth()});
  if(route==='attribution'&&req.method==='GET')return json({ok:true,items:await attribution(limitOf(u,50))});
  if(route==='experiments'&&req.method==='GET')return json({ok:true,items:await experiments(limitOf(u,50))});
  if(route==='market-truth-health'&&req.method==='GET')return json({ok:true,health:await marketTruthHealth()});
  if(route==='experiment-assign'&&req.method==='POST'){const body=await req.json().catch(()=>fail('valid JSON body required'));return json({ok:true,assignment:await assignExperiment(body)});}
  if(route==='experiment-link'&&req.method==='POST'){const body=await req.json().catch(()=>fail('valid JSON body required'));return json({ok:true,assignment:await linkExperiment(body)});}
  if(route==='economics'&&req.method==='POST'){const body=await req.json().catch(()=>fail('valid JSON body required'));return json({ok:true,economics:await recordEconomics(body)});}
  if(route==='feedback'&&req.method==='POST'){const body=await req.json().catch(()=>fail('valid JSON body required'));return json({ok:true,feedback:await recordFeedback(body)});}
  if(route==='daily'&&req.method==='POST'){const body=await req.json().catch(()=>({}));return json({ok:true,...await dailyIntelligence(body?.runDate)});}
  return json({ok:false,error:'NOT_FOUND'},404);
}catch(e){const message=String((e as Error)?.message||e);if(message.startsWith('BAD_REQUEST:'))return json({ok:false,error:message.slice(12)},400);return json({ok:false,error:message},500)}});