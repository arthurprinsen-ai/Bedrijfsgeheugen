// A SINGLE read-only intervention briefing for existing Powerhouse/ONE BRAIN/Heartbeat.
// Never reclassify a source-observed event as an independently verified paid buyer.
export const COMMERCIAL_FUNNEL_CONTRACT='POWERHOUSE_ONE_BRAIN_COMMERCIAL_FUNNEL_V1';
const isCount=x=>Number.isSafeInteger(x)&&x>=0;
const fromCount=x=>{
  if(x===undefined||x===null||x==='')return null;
  const n=Number(x);return isCount(n)?n:null;
};
const time=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):null;
const stage=(key,label,source,observed,quality,nextProof,originalOwner)=>({
  key,label,source,observed,quality,nextProof,originalOwner,
  independentlyVerified:false,customerOutcomeVerified:false
});
export function projectCommercialGrowthFunnel({growthDirection=null,socialFunnel=null,
  conversionProof=null,acquisitionCta=null,compoundImprovement=null,
  readStates={},at=new Date().toISOString()}={}){
 const now=time(at);
 if(now===null)return {contract:COMMERCIAL_FUNNEL_CONTRACT,status:'UNVERIFIED',
   reason:'INVALID_OBSERVATION_CLOCK',stages:[],priorities:[],guardrails:{}};
 const sourceStates=Object.fromEntries(['growthDaily','emailReplies','conversionProof',
 'socialPosts','socialSnapshots','acquisitionEvents','learningReadiness',
 'revenueFlywheel','socialApplications','revenueApplications'].map(key=>[key,readStates[key]||'UNAVAILABLE']));
 const observedAt=new Date(now).toISOString();
 const cpValid=readStates.conversionProof==='LIVE'&&conversionProof&&
   Number.isFinite(time(conversionProof.evaluated_at))&&
   time(conversionProof.evaluated_at)<=now+300000&&
   now-time(conversionProof.evaluated_at)<=90*60000;
 const cp=cpValid?conversionProof:null;
 const cta=cp?fromCount(cp.observed_cta_events_7d):null;
 const views=cp?fromCount(cp.human_flagged_pageviews_7d):null;
 const leads=cp?fromCount(cp.linked_qualified_lead_records_30d):null;
 const orders=cp?fromCount(cp.orders_with_recorded_provider_readback_30d):null;
 const socialQuality=readStates.socialPosts==='LIVE'&&readStates.socialSnapshots==='LIVE'&&
   socialFunnel?.status==='COMPARABLE_DESCRIPTIVE_METRICS'?
   'PROVIDER_COMPARABLE_48H_DESCRIPTIVE':'UNVERIFIED_OR_INCOMPARABLE';
 const socialChannels=socialQuality==='PROVIDER_COMPARABLE_48H_DESCRIPTIVE'?
   (socialFunnel.channels||[]).map(row=>({
     channel:String(row.channel||'unknown').slice(0,40),
     views:row.metrics?.views?.direction||'INSUFFICIENT_COMPARABLE_SAMPLE',
     likes:row.metrics?.likes?.direction||'INSUFFICIENT_COMPARABLE_SAMPLE',
     comments:row.metrics?.comments?.direction||'INSUFFICIENT_COMPARABLE_SAMPLE',
     reposts:row.metrics?.shares?.direction||'INSUFFICIENT_COMPARABLE_SAMPLE',
     clicks:row.metrics?.clicks?.direction||'INSUFFICIENT_COMPARABLE_SAMPLE'
   })):[];
 const website=growthDirection?.website?.metrics?.human_sessions??null;
 const websiteDirection=readStates.growthDaily==='LIVE'?
    (website?.direction||'INSUFFICIENT_COMPARABLE_DATA'):'UNVERIFIED';
 const emailReplyEvents=readStates.emailReplies==='LIVE'&&
   growthDirection?.email?.sourceState==='LIVE'?
   fromCount(growthDirection.email.recordedEvents14d):null;
 const revenue=compoundImprovement?.evidenceSources?.revenue;
 const applicationSocial=compoundImprovement?.evidenceSources?.socialApplications;
 const applicationRevenue=compoundImprovement?.evidenceSources?.revenueApplications;
 const learnApplied=applicationSocial?.status==='READBACK_COMPLETE'&&
     applicationRevenue?.status==='READBACK_COMPLETE'?
     fromCount(applicationSocial.applied7d)+fromCount(applicationRevenue.applied7d):null;
 const registeredRevenue=revenue?.status==='READBACK_COMPLETE'?
     (Number.isFinite(Number(revenue.realizedRevenueEur))&&revenue.realizedRevenueEur!==null?
       Number(revenue.realizedRevenueEur):null):null;
 const stages=[
  stage('social_reach_engagement','Social bereik: views, likes, reacties en reposts',
    'original social_posts + social_metric_snapshots 48h',socialChannels.length?socialChannels:null,
    socialQuality,'Dezelfde provider-ID met vergelijkbare 48h snapshots vóór inhoud/tijdstip experiment.',
    'Original Content Growth + Daily Publisher'),
  stage('social_to_site','Social/connecties → website',
    'original growth_events + Powerhouse acquisition CTA',null,
    'CROSS_CHANNEL_VISITOR_IDENTITY_NOT_VERIFIED',
    'Echte consented source/medium/campaign CTA-event-ID gekoppeld aan originele post/connectie; geen persooninferentie.',
    'Original SEO Order Engine + CRO'),
  stage('email_reply','Mail → echt antwoord',
    'powerhouse_email_reply_events',emailReplyEvents,
    emailReplyEvents===null?'UNVERIFIED':'RECORDED_REPLY_EVENTS_NOT_PROVIDER_ATTRIBUTED',
    'Oorspronkelijke send provider-message-ID, correcte reply-thread en toestemming; geen automatische nieuwe mail.',
    'Original Email Reply Learning'),
  stage('website_visit','Website interacties (geen unieke bezoekers)',
    'powerhouse_growth_source_daily_v1:website_interactions',
    websiteDirection==='UNVERIFIED'?null:{direction:websiteDirection,
      recent:website?.current??null,previous:website?.previous??null},
    websiteDirection==='UNVERIFIED'?'UNVERIFIED':websiteDirection,
    'Twee afgesloten weken met ≥5 juiste dagen en consent/botdekking; geen unique visitor claim.',
    'Original SEO/CRO Growth'),
  stage('persisted_cta','Website → opgeslagen CTA-event (7d)',
    'powerhouse_cro_conversion_evidence_v1',cta,
    !cp?'UNVERIFIED_OR_STALE':views!==null&&views>0&&cta===0?
      'CTA_EVENT_OR_INSTRUMENTATION_EVIDENCE_DUE':'PERSISTED_CTA_COUNT_ONLY',
    'Bestaande CTA-dekking op /zelfscan, /frisse-blik, /afsluiten, /contact, /aanmelden en /prijzen, via precies één SEO/CRO-meetproducer → growth-event 202 → oorspronkelijke drain → exact opgeslagen event-ID; 202/204 is geen opslag- of conversiebewijs.',
    'Original CRO Event Agent'),
  stage('buyer_lead','CTA → gekwalificeerde opt-in lead (30d)',
    'powerhouse_cro_conversion_evidence_v1',leads,
    !cp?'UNVERIFIED_OR_STALE':leads===0?'NO_LINKED_QUALIFIED_LEAD_PROOF':'LINKED_RECORDS_NOT_INDEPENDENT_BUYER_VERIFIED',
    'Vrijwillige contactgrondslag + echte lead-ID + juiste bron-ID en expliciet vervolg.',
    'Original Growth/Revenue OS'),
  stage('provider_order','Lead/connectie/mail → betaalde order (30d)',
    'powerhouse_cro_conversion_evidence_v1 + original Revenue Flywheel',orders,
    !cp?'UNVERIFIED_OR_STALE':orders===0?'NO_ORDER_PROVIDER_REFERENCE_RECORD':
    'ORDER_PROVIDER_REFERENCE_NOT_INDEPENDENT_PAYMENT',
    'Echte payment checkout/webhook, verified provider ID, tenant + bron + betaalde EUR; geen forecast als omzet.',
    'Original Revenue Flywheel'),
  stage('applied_learning','Resultaat → volgende natuurlijke agentactie',
    'original social_learning_applications + revenue_learning_applications',
    learnApplied,'APPLICATION_RECORDS_NOT_CAUSAL_EFFECT',
    'Echte application_id in volgende natuurlijke run + onafhankelijke effectmeting tegen een geldige controlegroep.',
    'Original ONE BRAIN + Heartbeat')
 ];
 const targets=[
  {code:'CTA_SOURCE_PRODUCER_TO_PERSISTED_ID',key:'persisted_cta',rank:100,
    eligible:views!==null&&views>0&&cta===0,owner:'Original CRO Event Agent',
    task:'Reconcile consented visible CTA → exact event-ID → existing Netlify drain → persisted Supabase readback. Verify missing tracking versus true zero before CRO variants.',
    metric:'persisted_consented_primary_cta_event_id_coverage'},
  {code:'LEAD_CONSENT_AND_ATTRIBUTION',key:'buyer_lead',rank:98,
    eligible:leads===0,owner:'Original Growth/Revenue OS',
    task:'Test one voluntary customer contact/scan follow-up; verify original consent, lead and source attribution before any outreach.',
    metric:'consented_qualified_leads_with_original_source_id'},
  {code:'INDEPENDENT_PAID_ORDER_READBACK',key:'provider_order',rank:95,
    eligible:orders===0,owner:'Original Revenue Flywheel',
    task:'Reconcile original checkout/payment provider ID and actual paid webhook with lead/action source; never book forecast as actual.',
    metric:'independently_verified_paid_order_count_and_eur'},
  {code:'SOCIAL_PROVIDER_48H_COMPARABILITY',key:'social_reach_engagement',rank:93,
    eligible:socialQuality!=='PROVIDER_COMPARABLE_48H_DESCRIPTIVE',owner:'Original Daily Publisher',
    task:'Collect existing independent provider-ID aligned 48h views/likes/comments/reposts/clicks; test hook/format/time only with comparable snapshots.',
    metric:'verified_comparable_48h_social_observation_coverage'},
  {code:'EMAIL_THREAD_REPLY_TO_BUYER',key:'email_reply',rank:90,
    eligible:emailReplyEvents===null||emailReplyEvents===0,owner:'Original Email Reply Learning',
    task:'Reconcile real provider send/thread/reply receipts and genuine opted-in customer action; avoid second sends.',
    metric:'provider_readback_qualified_replies_and_paid_outcomes'},
  {code:'SOURCE_BACKED_WEEKLY_WEBSITE_VISITORS',key:'website_visit',rank:88,
    eligible:websiteDirection==='INSUFFICIENT_COMPARABLE_DATA'||websiteDirection==='UNVERIFIED',owner:'Original SEO Order Engine',
    task:'Restore actual first-party and GA4/GSC comparable closed-week coverage without bypassing consent/bot filters.',
    metric:'source_verified_two_complete_week_website_sessions'},
  {code:'APPLY_LEARNING_AT_NEXT_NATURAL_RUN',key:'applied_learning',rank:85,
    eligible:learnApplied===0||learnApplied===null,owner:'Original ONE BRAIN/Heartbeat',
    task:'Read original fingerprint; record truly executed next original agent decision/application ID and independent subsequent effect.',
    metric:'verified_next_run_learning_application_and_effect'}
 ];
 const priorities=targets.filter(x=>x.eligible).sort((a,b)=>b.rank-a.rank).map((t,i)=>({
    ...t,priority:i+1,stageStatus:stages.find(s=>s.key===t.key)?.quality||'UNVERIFIED',
    executionState:'PROPOSED_NOT_EXECUTED',verifiedOutcome:false,
    originalSystem:'Powerhouse + ONE BRAIN + Heartbeat'
 }));
 return {contract:COMMERCIAL_FUNNEL_CONTRACT,observedAt,status:
   cpValid?'SOURCE_OBSERVED_COMMERCIAL_PROOF_INCOMPLETE':'PARTIAL_SOURCE_READBACK',
   comparisonRule:'Only compare channel/metric at the same provider-age and same complete closed period; never add snapshots into cross-channel conversions.',
   stages,priorities,sourceStates,
   observed:{pageviewEvents7d:views,persistedCtaEvents7d:cta,
     linkedQualifiedLeads30d:leads,orderProviderReferenceRecords30d:orders,
     emailReplyEvents14d:emailReplyEvents,verifiedPaidOrders:null,
     verifiedRevenueEur:null,registeredRevenueFlywheelEur:registeredRevenue,
     naturalLearningApplications7d:learnApplied,
     websiteWeekDirection:websiteDirection,social48hCoverage:socialQuality},
   guardrails:{noExtraScheduler:true,noNewWriter:true,noDuplicatePublisher:true,
     noTrackingWithoutConsent:true,noUnverifiedBuyerPaymentClaim:true,
     original15LoopStatusPreserved:true,causalSalesUpliftVerified:false,
     guaranteedDailyIncrease:false},nextRequiredProof:
     'one original owner event → independently verified result → next natural agent decision → ONE BRAIN learning with actual outcome'};
}
