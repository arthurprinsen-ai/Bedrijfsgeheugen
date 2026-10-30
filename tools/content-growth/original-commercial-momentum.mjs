// Pure read-only adapter for the EXISTING Powerhouse CRO/ONE BRAIN sources.
// Never invent customer revenue, "human" identity or causal uplift from views.
const n=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):0;
const sum=(rows,k)=>rows.reduce((a,r)=>a+n(r[k]),0);
const isoDay=at=>{
 const date=new Date(at);if(!Number.isFinite(date.getTime()))throw new TypeError('INVALID_MOMENTUM_CLOCK');
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
};
const shift=(iso,days)=>new Date(Date.parse(iso+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const keys=['page_views','cta_clicks','qualified_leads','won_orders','revenue_eur'];
function windowStat(rows,start,end){
 const active=new Set(),sums=Object.fromEntries(keys.map(k=>[k,0]));
 for(const r of rows){
  if(!r||typeof r.day!=='string'||r.day<start||r.day>end)continue;
  if(n(r.page_views)>0)active.add(r.day);
  for(const k of keys)sums[k]+=n(r[k]);
 }
 return {start,end,activeObservedDays:active.size,
  pageViews:sums.page_views,ctaClicks:sums.cta_clicks,
  qualifiedLeadRows:sums.qualified_leads,unverifiedOrderRows:sums.won_orders,
  unverifiedRevenueEur:sums.revenue_eur};
}
function metric(current,baseline,sufficient){
 const delta=sufficient?current-baseline:null;
 const pct=sufficient&&baseline>0?Math.round((current-baseline)/baseline*10000)/100:null;
 return {observedCurrent:current,observedBaseline:baseline,
   changeAbsolute:delta,changePercent:pct,
   direction:!sufficient?'INSUFFICIENT_COMPARABLE_SOURCE':baseline===0?'UNBOUNDED_ZERO_BASELINE':
   delta>0?'RISING':delta<0?'FALLING':'FLAT',causalProof:false};
}
export function projectOriginalCommercialMomentum({daily=[],readStatus='UNAVAILABLE',conversionProof=null,experimentProof=[],socialFunnel=null,outreachRecovery=null,at=new Date().toISOString()}={}){
 const day=isoDay(at),last=shift(day,-1),currentStart=shift(day,-7),priorEnd=shift(day,-8),priorStart=shift(day,-14);
 const rows=Array.isArray(daily)?daily:[],sourceGood=readStatus==='LIVE';
 const current=windowStat(sourceGood?rows:[],currentStart,last),previous=windowStat(sourceGood?rows:[],priorStart,priorEnd);
 // Missing source days are NOT proof of zero pageviews; 3 independently observed
 // nonempty days per arm is a minimum descriptive gate, not significance.
 const comparable=sourceGood&&current.activeObservedDays>=3&&previous.activeObservedDays>=3;
 const pageTrend=metric(current.pageViews,previous.pageViews,comparable);
 const observedClicks=Number.isFinite(Number(conversionProof?.observed_cta_events_7d))
  ?Number(conversionProof.observed_cta_events_7d):null;
 const ctaEvidence=conversionProof?.event_evidence_status==='PERSISTED_EVENTS_OBSERVED'&&
    observedClicks!==null&&observedClicks>0;
 const ctaTrend=metric(current.ctaClicks,previous.ctaClicks,comparable&&ctaEvidence);
 const badTracking=sourceGood&&current.pageViews>=100&&current.ctaClicks===0&&
   (!ctaEvidence||observedClicks===0);
 const byPage=new Map();
 if(sourceGood)for(const r of rows)if(r&&r.day>=currentStart&&r.day<=last){
  const k=String(r.canonical||'').slice(0,260);
  if(!k)continue;byPage.set(k,(byPage.get(k)||0)+n(r.page_views));
 }
 const ordered=[...byPage.entries()].sort((a,b)=>b[1]-a[1]);
 const top=ordered[0];
 const concentration=top&&current.pageViews>0
  ?{canonical:top[0],observedPageViews:top[1],share:Math.round(top[1]/current.pageViews*10000)/100,
    verifiedHumanTraffic:false,anomalySignal:top[1]>=100&&top[1]/current.pageViews>=0.5}
  :null;
 const experiment=Array.isArray(experimentProof)?experimentProof:[];
 const mature=experiment.some(x=>n(x.matured_treatment)>=Math.max(20,n(x.minimum_matured_per_arm))&&
  n(x.matured_holdout)>=Math.max(20,n(x.minimum_matured_per_arm)));
 const priority=!sourceGood?'RESTORE_ORIGINAL_WEBSITE_SOURCE':
  badTracking?'VERIFY_CTA_EMISSION_ACK_AND_PERSISTED_SOURCE':
  !comparable?'COLLECT_COMPARABLE_SEVEN_DAY_BASELINES':
  !mature?'RESTORE_CONTROLLED_EXPERIMENT_ELIGIBILITY':
  'REVIEW_MEASURED_CRO_HYPOTHESIS_WITH_ORIGINAL_OWNER';
 const flags=[];
 if(!sourceGood)flags.push('ORIGINAL_WEBSITE_DAILY_SOURCE_UNAVAILABLE');
 if(!comparable)flags.push('SEVEN_DAY_BASELINE_INSUFFICIENT');
 if(badTracking)flags.push('CTA_ZERO_WITH_TRAFFIC_MEASUREMENT_ANOMALY');
 if(concentration?.anomalySignal)flags.push('TOP_PAGE_CONCENTRATION_REVIEW_REQUIRED');
 if(!mature)flags.push('NO_MATURED_RANDOMIZED_CONTROL_COHORT');
 if(socialFunnel?.status!=='COMPARABLE_DESCRIPTIVE_METRICS')flags.push('SOCIAL_48H_AGE_MATCHED_EVIDENCE_DUE');
 return {contract:'POWERHOUSE_ORIGINAL_COMMERCIAL_MOMENTUM_V1',source:'public.growth_page_daily',
  at,timezone:'Europe/Amsterdam',status:sourceGood?'OBSERVED_INCOMPLETE':'SOURCE_UNAVAILABLE',
  current,previous,metrics:{websitePageViews:pageTrend,ctaClicks:ctaTrend},
  ctaMeasurement:{observedCtaEvents7d:observedClicks,verifiedNonzeroEventReceipt:ctaEvidence,
   conversionRatePercent:ctaEvidence&&current.pageViews>0?Math.round(current.ctaClicks/current.pageViews*10000)/100:null,
   interpretation:'MISSING_CTA_EVIDENCE_IS_UNKNOWN_NOT_TRUE_ZERO_CONVERSION'},
  topPage:concentration,
  social:{status:socialFunnel?.status||'UNVERIFIED',
   channelsMeasured:Array.isArray(socialFunnel?.channels)?socialFunnel.channels.length:0,
   engagementIsPaidOrders:false},
  email:{providerVerifiedSends:outreachRecovery?.status==='SOURCE_READBACK_COMPLETE'
    ?outreachRecovery.providerVerifiedSends:null,
   verifiedReplies:null,paidOrdersFromEmail:null,paidOrdersFromConnections:null,
   evidenceStatus:'ORIGINAL_PROVIDER_REPLY_AND_PAID_ORDER_LINEAGE_REQUIRED'},
  orders:{verifiedPaidOrders:null,verifiedRevenueEur:null,source:'INDEPENDENT_PAYMENT_PROVIDER_READBACK_REQUIRED'},
  randomizedExperiment:{maturedControlAndTreatment:mature,causalUpliftProven:false},
  priority:{decision:priority,owner:'original-powerhouse-cro-control-center',
   nextEvidence:'Consent-allowed real CTA event -> exact Netlify ACK ID -> existing Supabase growth_events ID -> attributed lead -> independent paid order -> original ONE BRAIN applied skill'},
  flags,futureIncreaseGuaranteed:false,addedScheduler:false,addedTruthStore:false};
}
