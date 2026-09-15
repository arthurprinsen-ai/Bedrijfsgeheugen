const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();
const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const arr=(v:unknown)=>Array.isArray(v)?v:[];
const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');
const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const headers={apikey:service,authorization:`Bearer ${service}`,'content-type':'application/json',accept:'application/json'};
const cors={'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'GET,POST,OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request,scope:string){
  const raw=clean(req.headers.get('x-powerhouse-token'));if(!raw||!base||!service)return false;
  const hash=await sha256(raw);const r=await fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}&active=eq.true&select=token_hash,scopes&limit=1`,{headers});if(!r.ok)return false;
  const row=(await r.json())?.[0];if(!row||!arr(row.scopes).includes(scope))return false;
  fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}`,{method:'PATCH',headers:{...headers,prefer:'return=minimal'},body:JSON.stringify({last_used_at:new Date().toISOString()})}).catch(()=>{});return true;
}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}});const text=await r.text();let data:any=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw new Error(`REST_${r.status}:${String(text).slice(0,500)}`);return data}
const limitOf=(u:URL,fallback=20)=>Math.max(1,Math.min(100,num(u.searchParams.get('limit'),fallback)));

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
  const date=clean(runDate)||new Date().toISOString().slice(0,10);const health=await healthReadback();
  const structural_lineage_gaps=num(health.structural_lineage_gaps,0);const research_queue_count=num(health.research_queue_count,0);const model_health_segments=num(health.model_health_segments,0);const model_watch_segments=num(health.model_watch_segments,0);const snapshot_stale=health.snapshot_stale===true;const state=structural_lineage_gaps>0||snapshot_stale?'degraded':'completed';
  const existing=await rest(`powerhouse_daily_runs?run_date=eq.${date}&select=*&limit=1`).catch(()=>[]);const prior=arr(existing)[0]||{};
  const evidence={...(prior.evidence||{}),revenue_intelligence_loop:{version:'1.1.0',structural_lineage_gaps,research_queue_count,model_health_segments,model_watch_segments,identity_gaps:num(health.identity_gaps,0),forecast_lineage_gaps:num(health.forecast_lineage_gaps,0),runtime_errors:num(health.runtime_errors,0),snapshot_refreshed_at:health.snapshot_refreshed_at||null,snapshot_age_minutes:health.snapshot_age_minutes,snapshot_stale,verified_at:new Date().toISOString()}};
  const row={run_date:date,dedupe_key:prior.dedupe_key||`daily:${date}`,state,action_count:num(prior.action_count,0),recommendation_count:num(prior.recommendation_count,0),evidence,completed_at:state==='completed'?(prior.completed_at||new Date().toISOString()):prior.completed_at||null,updated_at:new Date().toISOString()};
  await rest('powerhouse_daily_runs?on_conflict=run_date',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)});
  return{runDate:date,state,structural_lineage_gaps,research_queue_count,model_health_segments,model_watch_segments,snapshot_age_minutes:health.snapshot_age_minutes,snapshot_stale};
}

Deno.serve(async(req:Request)=>{try{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const u=new URL(req.url);const route=u.pathname.split('/').filter(Boolean).pop()||'health';
  const scopes:Record<string,string>={health:'health','command-center':'actions',accounts:'opportunities',research:'learning','model-health':'learning',attribution:'learning',experiments:'learning',daily:'daily'};const scope=scopes[route]||'learning';
  if(!await authorized(req,scope))return json({ok:false,error:'UNAUTHORIZED'},401);
  if(route==='health'&&req.method==='GET'){const readback=await healthReadback();return json({ok:true,runtime:'powerhouse-revenue-intelligence',version:'1.1.0',canonicalCore:'powerhouse-runtime',parallelBrain:false,snapshotBacked:true,commandCenterV2:true,accountIntelligence:true,researchFailClosed:true,modelMonitoring:true,db:true,readback,at:new Date().toISOString()})}
  if(route==='command-center'&&req.method==='GET')return json({ok:true,items:await commandCenter(limitOf(u,20))});
  if(route==='accounts'&&req.method==='GET')return json({ok:true,items:await accounts(limitOf(u,30))});
  if(route==='research'&&req.method==='GET')return json({ok:true,items:await research(limitOf(u,30))});
  if(route==='model-health'&&req.method==='GET')return json({ok:true,items:await modelHealth()});
  if(route==='attribution'&&req.method==='GET')return json({ok:true,items:await attribution(limitOf(u,50))});
  if(route==='experiments'&&req.method==='GET')return json({ok:true,items:await experiments(limitOf(u,50))});
  if(route==='daily'&&req.method==='POST'){const body=await req.json().catch(()=>({}));return json({ok:true,...await dailyIntelligence(body?.runDate)});}
  return json({ok:false,error:'NOT_FOUND'},404);
}catch(e){return json({ok:false,error:String((e as Error)?.message||e)},500)}});
