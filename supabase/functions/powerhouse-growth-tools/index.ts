import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-growth-tools-v1';
const clean=(v:unknown)=>String(v??'').trim();
const num=(v:unknown,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const json=(body:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{
  status,
  headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token',...headers}
});

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'GET,POST,OPTIONS'}});
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const u=new URL(req.url);
  let body:any={};
  if(req.method==='POST'){try{body=await req.json();}catch{}}
  const tool=clean(body?.tool||u.searchParams.get('tool')).toLowerCase();

  try{
    if(tool==='friction-index'||tool==='competitor-benchmark'){
      const sector=clean(body?.sector||u.searchParams.get('sector'));
      let q=db.from('powerhouse_friction_index_v1').select('*').order('sample_size',{ascending:false}).limit(50);
      if(sector)q=q.ilike('branche',sector);
      const {data,error}=await q;
      if(error)throw new Error('FRICTION_INDEX:'+error.message);
      return json({ok:true,contract:CONTRACT,tool,classification:'AGGREGATE_BENCHMARK',rows:data||[],privacy:'Only aggregate groups with sample size >= 5 are exposed.'});
    }

    if(tool==='lost-knowledge'){
      if(req.method!=='POST')return json({ok:false,error:'POST_REQUIRED'},405);
      const args={
        p_employees:Math.max(0,Math.trunc(num(body?.employees))),
        p_turnover_rate:Math.max(0,Math.min(1,num(body?.turnover_rate))),
        p_avg_loaded_cost_eur:Math.max(0,num(body?.avg_loaded_cost_eur)),
        p_critical_knowledge_share:Math.max(0,Math.min(1,num(body?.critical_knowledge_share,.25))),
        p_recovery_months:Math.max(0,num(body?.recovery_months,4))
      };
      const {data,error}=await db.rpc('powerhouse_lost_knowledge_value_v1',args);
      if(error)throw new Error('LOST_KNOWLEDGE:'+error.message);
      return json({ok:true,contract:CONTRACT,tool,result:data,cta:{type:'frisse_blik',label:'Laat Powerhouse de aannames met bedrijfsdata toetsen'}});
    }

    if(tool==='ma-risk'){
      if(req.method!=='POST')return json({ok:false,error:'POST_REQUIRED'},405);
      const args={
        p_key_person_dependency:Math.max(0,Math.min(1,num(body?.key_person_dependency))),
        p_process_documentation_gap:Math.max(0,Math.min(1,num(body?.process_documentation_gap))),
        p_management_information_gap:Math.max(0,Math.min(1,num(body?.management_information_gap))),
        p_system_fragmentation:Math.max(0,Math.min(1,num(body?.system_fragmentation))),
        p_knowledge_concentration:Math.max(0,Math.min(1,num(body?.knowledge_concentration)))
      };
      const {data,error}=await db.rpc('powerhouse_ma_knowledge_execution_risk_v1',args);
      if(error)throw new Error('MA_RISK:'+error.message);
      return json({ok:true,contract:CONTRACT,tool,result:data,cta:{type:'ma_due_diligence',label:'Maak een evidence-backed Knowledge & Execution Risk dossier'}});
    }

    if(tool==='workshop-benchmark'){
      const workshopKey=clean(body?.workshop_key||u.searchParams.get('workshop_key'));
      const submissionKey=clean(body?.submission_key||u.searchParams.get('submission_key'));
      if(!workshopKey)return json({ok:false,error:'WORKSHOP_KEY_REQUIRED'},400);
      const {data:rows,error}=await db.from('powerhouse_workshop_leaderboard_v1')
        .select('workshop_key,submission_key,branche,workshop_size,score,workshop_average,delta_to_workshop,percentile_rank,aangemaakt')
        .eq('workshop_key',workshopKey).order('score',{ascending:false}).limit(500);
      if(error)throw new Error('WORKSHOP_BENCHMARK:'+error.message);
      const safe=(rows||[]);
      const own=submissionKey?safe.find((x:any)=>clean(x.submission_key)===submissionKey):null;
      const values=safe.map((x:any)=>num(x.score)).filter((x:number)=>Number.isFinite(x));
      const summary={
        workshop_key:workshopKey,
        sample_size:safe.length,
        average:values.length?values.reduce((a:number,b:number)=>a+b,0)/values.length:null,
        top_quartile_threshold:values.length?values.sort((a:number,b:number)=>a-b)[Math.max(0,Math.ceil(values.length*.75)-1)]:null
      };
      return json({ok:true,contract:CONTRACT,tool,summary,participant:own?{score:own.score,delta_to_workshop:own.delta_to_workshop,percentile_rank:own.percentile_rank}:null,privacy:'No participant identities are returned.'});
    }

    if(tool==='revenue-swarm'){
      const {data:tokenData}=await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'});
      const expected=clean(tokenData);
      if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
      const {data,error}=await db.from('powerhouse_revenue_swarm_v1')
        .select('*').order('revenue_rank',{ascending:true}).limit(50);
      if(error)throw new Error('REVENUE_SWARM:'+error.message);
      return json({ok:true,contract:CONTRACT,tool,rows:data||[]});
    }

    return json({ok:false,error:'UNKNOWN_TOOL',supported:['friction-index','competitor-benchmark','lost-knowledge','ma-risk','workshop-benchmark','revenue-swarm']},400);
  }catch(err:any){
    return json({ok:false,contract:CONTRACT,error:clean(err?.message||err).slice(0,500)},503);
  }
});
