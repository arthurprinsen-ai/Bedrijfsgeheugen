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

export function projectOtherData({daily=[],experiments=[],policies=[],conversionProof=[],experimentProof=[],readStates={},at=new Date().toISOString()}={}){
  const dailyOk=readStates.daily==='LIVE';
  const experimentsOk=readStates.experiments==='LIVE';
  const conversionProofOk=readStates.conversionProof==='LIVE'&&conversionProof.length===1;
  const experimentProofOk=readStates.experimentProof==='LIVE';
  const complete=dailyOk&&experimentsOk&&readStates.policies==='LIVE'&&conversionProofOk&&experimentProofOk;
  const dailyLast=daily.reduce((latest,row)=>String(row.updated_at||'')>latest?String(row.updated_at):latest,'');
  const experimentLast=experiments.reduce((latest,row)=>String(row.updated_at||'')>latest?String(row.updated_at):latest,'');
  const totals=dailyOk?{
    pageViews:sum(daily,'page_views'),ctaClicks:sum(daily,'cta_clicks'),
    qualifiedLeads:sum(daily,'qualified_leads'),wonOrders:sum(daily,'won_orders'),
    revenueEur:sum(daily,'revenue_eur')
  }:null;
  const flags=[];
  if(!dailyOk)flags.push('WEBSITE_DAILY_SOURCE_UNAVAILABLE');
  if(!experimentsOk)flags.push('EXPERIMENT_SOURCE_UNAVAILABLE');
  if(readStates.policies!=='LIVE')flags.push('EXPERIMENT_POLICY_UNAVAILABLE');
  if(!conversionProofOk)flags.push('PERSISTED_CONVERSION_PROOF_SOURCE_UNAVAILABLE');
  if(!experimentProofOk)flags.push('CONTROLLED_EXPERIMENT_PROOF_SOURCE_UNAVAILABLE');
  if(dailyOk&&totals.pageViews>0&&totals.ctaClicks===0)flags.push('CTA_TRACKING_NOT_VERIFIED');
  if(experimentsOk&&experiments.some(e=>!e.causal_status||e.causal_status==='insufficient_evidence'))flags.push('EXPERIMENT_EVIDENCE_INCOMPLETE');
  const cp=conversionProofOk?conversionProof[0]:null;
  if(cp?.event_evidence_status!=='PERSISTED_EVENTS_OBSERVED')flags.push('PERSISTED_EVENT_PARITY_NOT_PROVEN');
  if(cp?.lead_evidence_status!=='LINKED_RECORDS_REQUIRE_INDEPENDENT_BUYER_VERIFICATION')flags.push('QUALIFIED_LEAD_READBACK_NOT_PROVEN');
  flags.push('INDEPENDENT_PAID_ORDER_VERIFICATION_REQUIRED');
  return {
    contract:'POWERHOUSE_CRO_OTHER_DATA_V1',generatedAt:at,
    scope:'canonical',status:complete?'LIVE':'PARTIAL',
    sources:{
      website:{status:readStates.daily||'UNAVAILABLE',lastObservedAt:dailyLast||null,records:dailyOk?daily.length:null},
      experiments:{status:readStates.experiments||'UNAVAILABLE',lastObservedAt:experimentLast||null,records:experimentsOk?experiments.length:null},
      policies:{status:readStates.policies||'UNAVAILABLE',records:readStates.policies==='LIVE'?policies.length:null},
      conversionProof:{status:conversionProofOk?'LIVE':readStates.conversionProof||'UNAVAILABLE',records:conversionProofOk?1:null},
      experimentProof:{status:experimentProofOk?'LIVE':readStates.experimentProof||'UNAVAILABLE',records:experimentProofOk?experimentProof.length:null}
    },
    quality:{flags,botFiltering:'UNKNOWN_IN_THIS_PROJECTION',deliveryAcknowledgement:'UNVERIFIED',message:'Geregistreerde events, leadrecords en providerreferenties zijn niet hetzelfde als onafhankelijk bevestigde klanten of betaalde orders.'},
    conversionProof:cp?{
      eventStatus:safeText(cp.event_evidence_status,100),leadStatus:safeText(cp.lead_evidence_status,100),orderStatus:safeText(cp.order_evidence_status,120),experimentStatus:safeText(cp.experiment_evidence_status,120),
      observedCtaEvents7d:safeNumber(cp.observed_cta_events_7d),dailyCtaAggregated7d:safeNumber(cp.daily_cta_aggregated_7d),
      recordedLeads30d:safeNumber(cp.recorded_leads_30d),linkedQualifiedLeadRecords30d:safeNumber(cp.linked_qualified_lead_records_30d),
      ordersWithRecordedProviderReadback30d:safeNumber(cp.orders_with_recorded_provider_readback_30d),lastPersistedEventAt:cp.last_persisted_event_at||null,
      paidOrdersIndependentlyVerified:null,realizedRevenueIndependentlyVerifiedEur:null
    }:null,
    experimentProof:experimentProofOk?experimentProof.map(row=>({
      key:safeText(row.experiment_key,120),status:safeText(row.evidence_status,120),policyStatus:safeText(row.policy_status,100),
      primaryMetric:safeText(row.primary_metric,100),minimumPerArm:safeNumber(row.minimum_matured_per_arm),
      maturedTreatment:safeNumber(row.matured_treatment),maturedHoldout:safeNumber(row.matured_holdout),lastAssignmentAt:row.last_assignment_at||null
    })):null,
    website:totals,
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
  // Lazily resolve provider SDK only after the unauthenticated request was rejected.
  // GitHub protected admission runs pure contract tests without installing Netlify packages;
  // production with valid tokens still uses the same verified Netlify Identity SDK.
  let user;
  try { const sdk=await import('@netlify/identity'); user=await sdk.getUser(request); }
  catch { return reply({error:'IDENTITY_PROVIDER_UNAVAILABLE'},503); }
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
    select(base,key,'powerhouse_cro_conversion_evidence_v1',
      'select=event_evidence_status,lead_evidence_status,order_evidence_status,experiment_evidence_status,observed_cta_events_7d,daily_cta_aggregated_7d,recorded_leads_30d,linked_qualified_lead_records_30d,orders_with_recorded_provider_readback_30d,last_persisted_event_at&limit=2'),
    select(base,key,'powerhouse_cro_experiment_evidence_v1',
      'select=experiment_key,evidence_status,policy_status,primary_metric,minimum_matured_per_arm,matured_treatment,matured_holdout,last_assignment_at&limit=151')
  ];
  const responses=await Promise.allSettled(queries);
  const limits=[2000,150,50,1,150];
  const stateNames=['daily','experiments','policies','conversionProof','experimentProof'],readStates={},datasets=[];
  for(let i=0;i<responses.length;i++){
    const answer=responses[i];
    const rows=answer.status==='fulfilled'?answer.value:[];
    const complete=answer.status==='fulfilled'&&rows.length<=limits[i];
    readStates[stateNames[i]]=complete?'LIVE':rows.length>limits[i]?'TRUNCATED':'UNAVAILABLE';
    datasets[i]=complete?rows:[];
  }
  const projection=projectOtherData({daily:datasets[0],experiments:datasets[1],policies:datasets[2],conversionProof:datasets[3],experimentProof:datasets[4],readStates});
  return reply(projection,projection.status==='LIVE'?200:206);
}
export const config={path:'/api/powerhouse-cro-other-data'};
