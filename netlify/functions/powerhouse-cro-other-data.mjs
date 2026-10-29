import { getUser } from '@netlify/identity';
import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';

// Owner-only, read-only projection of the EXISTING Supabase growth and CRO authorities.
// No new scheduler, experiment writer, customer-data leak or duplicate data store.
const reply=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store','pragma':'no-cache',
  'vary':'authorization, cookie','x-robots-tag':'noindex, nofollow, noarchive',
  'x-content-type-options':'nosniff'
}});
const safeNumber=value=>value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null;
const sum=(rows,key)=>rows.reduce((total,row)=>total+(safeNumber(row[key])||0),0);
const safeText=(value,max=260)=>String(value??'').slice(0,max);
const allowedTenant='canonical';

function projectExperiment(row){
  return {
    id:safeText(row.experiment_id,120),
    hypothesis:safeText(row.hypothesis||row.commercial_hypothesis,500),
    pagina:safeText(row.pagina,260),onderdeel:safeText(row.onderdeel,150),
    variant:safeText(row.variant,160),controle:safeText(row.controle,160),
    metric:safeText(row.primary_metric||row.meetpunt,120),
    status:safeText(row.status,70),
    start:row.started_at||null,end:row.ended_at||null,
    minSample:safeNumber(row.min_steekproef),
    treatment:safeNumber(row.treatment_assignments),
    holdout:safeNumber(row.holdout_assignments),
    causalStatus:safeText(row.causal_status,100),
    promotionStatus:safeText(row.promotion_status,100),
    eligible:row.promotion_eligible===true,
    readinessReason:safeText(row.readiness_reason,260),
    advice:safeText(row.advies,500),
    decision:safeText(row.besluit,260),
    result:row.resultaat||null,
    baseline:row.basislijn||null,
    realizedRevenue:safeNumber(row.realized_revenue_eur)
  };
}


function summarizeBehavior(rows){
  const keys=['page_events','tab_sessions','scroll_reached_25','scroll_reached_50','scroll_reached_75','scroll_reached_100','observed_exits','observed_exits_under_25','form_starts','form_errors','form_abandons','whatsapp_clicks','rapid_click_heuristics','popup_exposures','experiment_exposures'];
  const events=Object.fromEntries(keys.map(key=>[key,sum(rows,key)]));
  const pages=new Map(),sections=new Map();
  for(const row of rows){
    const pad=safeText(row.pad,260),section=safeText(row.last_visible_section,80);
    const page=pages.get(pad)||{pad,observedExits:0,earlyExitSignals:0,formAbandons:0};
    page.observedExits+=safeNumber(row.observed_exits)||0;
    page.earlyExitSignals+=safeNumber(row.observed_exits_under_25)||0;
    page.formAbandons+=safeNumber(row.form_abandons)||0;
    pages.set(pad,page);
    if(section&&section!=='_overige_events'){
      const id=pad+'|'+section,entry=sections.get(id)||{pad,section,observedExits:0,earlyExitSignals:0};
      entry.observedExits+=safeNumber(row.observed_exits)||0;
      entry.earlyExitSignals+=safeNumber(row.observed_exits_under_25)||0;
      sections.set(id,entry);
    }
  }
  return {events,pages:[...pages.values()].sort((a,b)=>b.observedExits-a.observedExits).slice(0,30),
    exitSections:[...sections.values()].sort((a,b)=>b.observedExits-a.observedExits).slice(0,30),
    interpretation:'Only consented non-bot events; pagehide is incomplete, tab sessions are not unique visitors, and this is no causal proof.'};
}

export function projectOtherData({daily=[],experiments=[],policies=[],behavior=[],readStates={},at=new Date().toISOString()}={}){
  const dailyOk=readStates.daily==='LIVE';
  const experimentsOk=readStates.experiments==='LIVE';
  const behaviorOk=readStates.behavior==='LIVE';
  const complete=dailyOk&&experimentsOk&&readStates.policies==='LIVE'&&behaviorOk;
  const dailyLast=daily.reduce((latest,row)=>String(row.updated_at||'')>latest?String(row.updated_at):latest,'');
  const experimentLast=experiments.reduce((latest,row)=>String(row.updated_at||'')>latest?String(row.updated_at):latest,'');
  const behaviorLast=behavior.reduce((latest,row)=>String(row.last_observed_at||'')>latest?String(row.last_observed_at):latest,'');
  const behaviorData=behaviorOk?summarizeBehavior(behavior):null;
  const totals=dailyOk?{
    pageViews:sum(daily,'page_views'),ctaClicks:sum(daily,'cta_clicks'),
    qualifiedLeads:sum(daily,'qualified_leads'),wonOrders:sum(daily,'won_orders'),
    revenueEur:sum(daily,'revenue_eur')
  }:null;
  const flags=[];
  if(!dailyOk)flags.push('WEBSITE_DAILY_SOURCE_UNAVAILABLE');
  if(!experimentsOk)flags.push('EXPERIMENT_SOURCE_UNAVAILABLE');
  if(readStates.policies!=='LIVE')flags.push('EXPERIMENT_POLICY_UNAVAILABLE');
  if(!behaviorOk)flags.push('BEHAVIOR_EXIT_SOURCE_UNAVAILABLE');
  if(dailyOk&&totals.pageViews>0&&totals.ctaClicks===0)flags.push('CTA_TRACKING_NOT_VERIFIED');
  if(experimentsOk&&experiments.some(e=>!e.causal_status||e.causal_status==='insufficient_evidence'))flags.push('EXPERIMENT_EVIDENCE_INCOMPLETE');
  return {
    contract:'POWERHOUSE_CRO_OTHER_DATA_V1',generatedAt:at,
    scope:'canonical',status:complete?'LIVE':'PARTIAL',
    sources:{
      website:{status:readStates.daily||'UNAVAILABLE',lastObservedAt:dailyLast||null,records:dailyOk?daily.length:null},
      experiments:{status:readStates.experiments||'UNAVAILABLE',lastObservedAt:experimentLast||null,records:experimentsOk?experiments.length:null},
      policies:{status:readStates.policies||'UNAVAILABLE',records:readStates.policies==='LIVE'?policies.length:null},
      behavior:{status:readStates.behavior||'UNAVAILABLE',lastObservedAt:behaviorLast||null,records:behaviorOk?behavior.length:null}
    },
    quality:{flags,botFiltering:'UNKNOWN_IN_THIS_PROJECTION',deliveryAcknowledgement:'UNVERIFIED',message:'Website-events zijn observaties, geen onafhankelijke leads/orders. Onbekend is nooit nul.'},
    website:totals,
    behavior:behaviorData,
    policies:readStates.policies==='LIVE'?policies.map(row=>({
      key:safeText(row.experiment_key,120),status:safeText(row.status,100),
      primaryMetric:safeText(row.primary_metric,120),minPerArm:safeNumber(row.min_matured_per_arm),
      treatmentPercent:safeNumber(row.treatment_pct)
    })):null,
    experiments:experimentsOk?experiments.map(projectExperiment):null
  };
}

const API_TIMEOUT_MS=4500;
async function select(base,key,table,query){
  const response=await fetch(base+'/rest/v1/'+table+'?'+query,{
    headers:{accept:'application/json',apikey:key,authorization:'Bearer '+key},
    signal:AbortSignal.timeout(API_TIMEOUT_MS)
  });
  if(!response.ok)throw new Error('SUPABASE_READ_'+table+'_'+response.status);
  const rows=await response.json();
  if(!Array.isArray(rows))throw new Error('INVALID_READ_MODEL_'+table);
  return rows;
}

export default async function handler(request){
  if(request.method!=='GET')return reply({error:'METHOD_NOT_ALLOWED'},405);
  if(!/^Bearer\s+\S+/i.test(request.headers.get('authorization')||''))return reply({error:'UNAUTHENTICATED'},401);
  const user=await getUser(request);
  if(!user?.id)return reply({error:'UNAUTHENTICATED'},401);
  if(!isPowerhouseAdmin(user,{allowedEmails:String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim()}))
    return reply({error:'POWERHOUSE_ADMIN_REQUIRED'},403);

  const base=String(Netlify.env.get('SUPABASE_URL')||Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  const key=String(Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')||'').trim();
  if(!base||!key)return reply({error:'READ_MODEL_CONFIG_UNAVAILABLE'},503);
  const from=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
  const queries=[
    select(base,key,'growth_page_daily',
      'select=day,canonical,intent_owner,page_views,cta_clicks,qualified_leads,won_orders,revenue_eur,updated_at&day=gte.'+from+'&order=day.desc&limit=2001'),
    select(base,key,'powerhouse_experiment_learning_v2',
      'select=experiment_id,hypothesis,commercial_hypothesis,pagina,onderdeel,variant,controle,primary_metric,meetpunt,status,started_at,ended_at,updated_at,min_steekproef,treatment_assignments,holdout_assignments,causal_status,promotion_status,promotion_eligible,readiness_reason,advies,besluit,resultaat,basislijn,realized_revenue_eur&tenant_id=eq.'+allowedTenant+'&order=started_at.desc&limit=151'),
    select(base,key,'powerhouse_experiment_policies',
      'select=experiment_key,status,primary_metric,min_matured_per_arm,treatment_pct&limit=51'),
    select(base,key,'bg_cro_behavior_daily_v1',
      'select=day,pad,device,last_visible_section,page_events,tab_sessions,scroll_reached_25,scroll_reached_50,scroll_reached_75,scroll_reached_100,observed_exits,observed_exits_under_25,form_starts,form_errors,form_abandons,whatsapp_clicks,rapid_click_heuristics,popup_exposures,experiment_exposures,last_observed_at&day=gte.'+from+'&order=day.desc&limit=5001')
  ];
  const responses=await Promise.allSettled(queries);
  const limits=[2000,150,50,5000];
  const stateNames=['daily','experiments','policies','behavior'],readStates={},datasets=[];
  for(let i=0;i<responses.length;i++){
    const answer=responses[i];
    const rows=answer.status==='fulfilled'?answer.value:[];
    const complete=answer.status==='fulfilled'&&rows.length<=limits[i];
    readStates[stateNames[i]]=complete?'LIVE':rows.length>limits[i]?'TRUNCATED':'UNAVAILABLE';
    datasets[i]=complete?rows:[];
  }
  const projection=projectOtherData({daily:datasets[0],experiments:datasets[1],policies:datasets[2],behavior:datasets[3],readStates});
  return reply(projection,projection.status==='LIVE'?200:206);
}
export const config={path:'/api/powerhouse-cro-other-data'};
