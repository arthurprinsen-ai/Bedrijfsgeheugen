import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';
import {projectSocialCroFunnel} from './_social-cro-funnel-projection.mjs';
import {projectPowerhouseGrowthDirection} from './_powerhouse-growth-direction.mjs';
import { loadOneLoopAssurance, ONE_LOOP_ASSURANCE_CONTRACT } from '../../brain/observability/one-loop-assurance-readback.mjs';

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
  const keys=['page_events','persisted_event_receipts','historical_without_receipt','tab_sessions','scroll_reached_25','scroll_reached_50','scroll_reached_75','scroll_reached_100','observed_exits','observed_exits_under_25','form_starts','form_errors','form_abandons','whatsapp_clicks','rapid_click_heuristics','popup_exposures','experiment_exposures'];
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

// Read ONLY the existing canonical ONE BRAIN record. This is not a second
// outcome engine: verified=false means neither customer value nor payment was proven.
const CRO_GATES=Object.freeze([
 'BRAIN_DELIVERY_READBACK','FIRST_PARTY_EVENT_RECEIPT','ACTUAL_CTA_EXPOSURE',
 'CONTROLLED_CRO_EXPERIMENT','QUALIFIED_BUYER_READBACK',
 'PAID_ORDER_READBACK','ONE_BRAIN_LEARNING_APPLIED'
]);
export function projectCroBrainProof(rows,{at=new Date().toISOString()}={}){
 const fail=reason=>({status:'NOT_VERIFIED',reason,recordId:null,
   lastObservedAt:null,technicalReadbackVerified:false,businessOutcomeVerified:false,
   verifiedPaidRevenueEur:null,gates:[]});
 if(!Array.isArray(rows)||rows.length!==1)return fail('ONE_BRAIN_RECORD_MISSING');
 const r=rows[0],p=r?.payload;
 if(r?.record_type!=='Verification'||r?.record_kind!=='verification'||
    r?.owner_id!=='powerhouse-commercial-heartbeat-runner'||
    r?.executed!==true||r?.verified!==false||r?.status!=='OBSERVED'||
    typeof r?.record_id!=='string'||!/^cro-commercial-evidence:[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(r.record_id)||
    p?.contract!=='POWERHOUSE_CRO_COMMERCIAL_CLOSURE_V1'||
    p?.status!=='EVIDENCE_INCOMPLETE')return fail('ONE_BRAIN_RECORD_CONTRACT_MISMATCH');
 const seen=new Set(),gates=[];
 for(const row of p.gates||[]){
   if(!CRO_GATES.includes(row?.gate)||typeof row.verified!=='boolean'||seen.has(row.gate))return fail('GATE_SET_INVALID');
   seen.add(row.gate);gates.push({gate:row.gate,verified:row.verified});
 }
 if(gates.length!==CRO_GATES.length)return fail('GATE_SET_INCOMPLETE');
 const ts=Date.parse(r.observed_at),now=Date.parse(at);
 if(!Number.isFinite(ts)||!Number.isFinite(now)||ts>now+300000||now-ts>2*3600000)
   return fail('ONE_BRAIN_READBACK_STALE_OR_FUTURE');
 const allGates=gates.every(g=>g.verified);
 // A read-only record can never attest an independently verified paid outcome.
 return {status:'EVIDENCE_INCOMPLETE',reason:allGates?'INDEPENDENT_PROVIDER_AUDIT_REQUIRED':'MISSING_COMMERCIAL_PROOF',
   recordId:r.record_id,lastObservedAt:r.observed_at,
   technicalReadbackVerified:true,businessOutcomeVerified:false,
   verifiedPaidRevenueEur:null,gates,
   observed:{
     ctaEvents7d:safeNumber(p.observed?.ctaEvents7d),
     linkedLeadRecords30d:safeNumber(p.observed?.linkedLeadRecords30d),
     orderProviderReferenceRecords30d:safeNumber(p.observed?.orderProviderReferenceRecords30d),
     maturedTreatment:safeNumber(p.observed?.maturedTreatment),
     maturedHoldout:safeNumber(p.observed?.maturedHoldout)
   }};
}


/** An adapter, never a second classifier: preserve the original 15-loop status. */
export function projectCroOneLoopAssurance(source){
  const unavailable=reason=>({status:'UNVERIFIED',reason:String(reason||'ORIGINAL_LOOP_SOURCE_UNAVAILABLE').slice(0,120),
    counts:null,overallStatus:'UNVERIFIED',loops:[],source:'public.powerhouse_loop_assurance_state_v1'});
  if(!source||source.status!=='READBACK_COMPLETE'||source.contract!==ONE_LOOP_ASSURANCE_CONTRACT)
    return unavailable(source?.reason);
  const counts=source.counts,rows=source.loops;
  if(!Array.isArray(rows)||rows.length!==15||counts?.total!==15||
     ![counts.green,counts.amber,counts.red].every(n=>Number.isInteger(n)&&n>=0)||
     counts.green+counts.amber+counts.red!==15||new Set(rows.map(r=>r?.key)).size!==15)
    return unavailable('CANONICAL_LOOP_COUNT_MISMATCH');
  if(rows.some(r=>!['GREEN','AMBER','RED'].includes(r?.status)||typeof r?.key!=='string'||
       !['FAILED','PASSED','NOT_RECORDED'].includes(r?.guard)||
       !Array.isArray(r?.missingStages)||r.missingStages.some(s=>typeof s!=='string')||
       (r.status==='GREEN'&&(r.guard==='FAILED'||r.missingStages.length))))
    return unavailable('ORIGINAL_LOOP_GUARD_MISMATCH');
  if(rows.filter(r=>r.status==='GREEN').length!==counts.green||
     rows.filter(r=>r.status==='AMBER').length!==counts.amber||
     rows.filter(r=>r.status==='RED').length!==counts.red)
    return unavailable('ORIGINAL_LOOP_STATUS_COUNT_MISMATCH');
  return {status:'READBACK_COMPLETE',reason:null,
    counts:{total:15,green:counts.green,amber:counts.amber,red:counts.red},
    overallStatus:source.overallStatus,source:'public.powerhouse_loop_assurance_state_v1',
    checkedAt:source.observedAt,loops:rows.map(r=>({
      key:r.key,status:r.status,guard:r.guard,
      missingStages:r.missingStages.slice(0,12),problem:String(r.problem||'').slice(0,80)
    }))};
}

/** Read-only aggregate. Original sales actions remain the one system of record.
 * Never infer actual external provider delivery from a prepared email or internal research. */
export function projectOutreachSourceRecovery(actions,research,{actionsStatus='UNAVAILABLE',researchStatus='UNAVAILABLE'}={}){
  const valid=actionsStatus==='LIVE'&&researchStatus==='LIVE'&&Array.isArray(actions)&&Array.isArray(research);
  if(!valid)return {status:'UNVERIFIED',reason:'ORIGINAL_OUTREACH_READBACK_UNAVAILABLE',
    sourceResearchHeld:null,internalResearchPending:null,internalResearchDone:null,providerVerifiedSends:null,researchNoCurrentSignal:null,researchSourceCandidatesUnverified:null,nextOriginalResearchAt:null};
  const held=actions.filter(r=>r?.status==='prepared'&&r?.evidence?.execution_gate?.reason==='SOURCE_SPECIFIC_EVIDENCE_REQUIRED').length;
  const provider=actions.filter(r=>r?.status==='done'&&
    r.evidence?.autonomous_outbound?.provider_ack_verified===true&&
    r.evidence?.autonomous_outbound?.provider_readback_verified===true&&
    typeof r.evidence?.autonomous_outbound?.provider_message_id==='string'&&
    r.evidence.autonomous_outbound.provider_message_id.length>0).length;
  return {status:'SOURCE_READBACK_COMPLETE',reason:null,sourceResearchHeld:held,
    internalResearchPending:research.filter(r=>['suggested','prepared','waiting'].includes(r.status)).length,
    internalResearchDone:research.filter(r=>r.status==='done').length,
    researchNoCurrentSignal:research.filter(r=>r?.status==='waiting'&&r?.evidence?.public_research_execution?.no_current_trigger_evidence===true).length,
    researchSourceCandidatesUnverified:research.filter(r=>r?.evidence?.relationship_source_candidate?.status==='UNVERIFIED_SOURCE_CANDIDATE').length,
    nextOriginalResearchAt:research.map(r=>r?.evidence?.public_research_execution?.next_research_at)
      .filter(t=>typeof t==='string'&&Number.isFinite(Date.parse(t))).sort()[0]||null,
    providerVerifiedSends:provider,
    businessOutcomeVerified:false,
    owner:'original-powerhouse-autonomous-outreach',nextOwner:'original-powerhouse-relationship-public-research',
    source:'public.powerhouse_sales_actions',note:'Original action metadata, not independently audited Gmail or revenue.'};
}


/**
 * Descriptive closed-day website trend from the EXISTING growth_page_daily source.
 * No visitors, payment, provider, order, conversion or causal-success claims.
 * A missing calendar day is UNKNOWN, not zero. Never extrapolate partial periods.
 */
export function projectWebsiteWeeklyGrowth(rows,{state='UNAVAILABLE',at=new Date().toISOString()}={}){
  const empty=(reason,details={})=>({status:'UNVERIFIED',reason,metricEvidence:'OBSERVATIONAL_ONLY',
    periodDays:7,metrics:null,missingDays:[],...details});
  if(state!=='LIVE'||!Array.isArray(rows))return empty('DAILY_SOURCE_NOT_VERIFIED');
  const moment=new Date(at);
  if(!Number.isFinite(moment.getTime()))return empty('INVALID_OBSERVATION_DATE');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(moment).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  const today=`${parts.year}-${parts.month}-${parts.day}`;
  const base=Date.parse(today+'T00:00:00Z');
  if(!Number.isFinite(base))return empty('INVALID_BUSINESS_DATE');
  const keys=['page_views','cta_clicks','qualified_leads','won_orders'];
  const dayAt=back=>new Date(base-back*86400000).toISOString().slice(0,10);
  const dates=Array.from({length:14},(_,i)=>dayAt(14-i));
  const byDay=new Map();
  for(const row of rows){
    const day=typeof row?.day==='string'?row.day.slice(0,10):'';
    if(!dates.includes(day))continue;
    const values={};
    for(const key of keys){
      const raw=row[key],n=Number(raw);
      if(raw===null||raw===undefined||raw===''||!Number.isFinite(n)||n<0)
        return empty('INVALID_OR_MISSING_DAY_METRIC',{invalidDay:day,invalidMetric:key});
      values[key]=n;
    }
    const prior=byDay.get(day)||Object.fromEntries(keys.map(key=>[key,0]));
    for(const key of keys)prior[key]+=values[key];
    byDay.set(day,prior);
  }
  const missingDays=dates.filter(day=>!byDay.has(day));
  const baseDates=dates.slice(0,7),recentDates=dates.slice(7);
  const result={baseline:{from:baseDates[0],through:baseDates.at(-1)},
    recent:{from:recentDates[0],through:recentDates.at(-1)}};
  if(missingDays.length)return empty('INCOMPLETE_DAILY_COVERAGE',{
    ...result,observedDays:byDay.size,missingDays});
  const sums=days=>Object.fromEntries(keys.map(key=>[key,days.reduce((v,day)=>v+byDay.get(day)[key],0)]));
  const earlier=sums(baseDates),current=sums(recentDates);
  const metrics={};
  for(const key of keys){
    const prev=earlier[key],now=current[key];
    metrics[key]={previous:prev,current:now,
      changePct:prev>0?Math.round((now-prev)/prev*10000)/100:null,
      direction:prev===0?(now===0?'FLAT_ZERO':'BASELINE_ZERO'):
        now>prev?'UP':now<prev?'DOWN':'FLAT'};
  }
  const rate=(numerator,denominator)=>denominator>0?
    Math.round(numerator/denominator*10000)/100:null;
  return {status:earlier.page_views>=30&&current.page_views>=30?
    'COMPARABLE_DESCRIPTIVE_OBSERVATIONS':'LOW_SAMPLE_DESCRIPTIVE_ONLY',
    reason:null,metricEvidence:'OBSERVATIONAL_ONLY',periodDays:7,missingDays:[],
    observedDays:14,...result,metrics,
    ctaRate:{previous:rate(earlier.cta_clicks,earlier.page_views),
      current:rate(current.cta_clicks,current.page_views)},
    businessClaims:{paidOrdersVerified:false,qualifiedBuyersIndependentlyVerified:false,
      uniqueVisitorsKnown:false,attributedRevenueVerified:false},
    note:'Two completed Europe/Amsterdam calendar weeks. Page views are not unique visitors; lead/order counts are unverified rollup observations, not paid orders.'};
}

/**
 * Reuse the existing service-role CRO evidence view. "is_robot=false" is only
 * a first-party event flag, not an independently verified human visitor.
 * Never divide by all 30-day daily pageviews to label a 7-day conversion rate.
 * A zero CTA observation with nonzero pageviews is an instrument/behavior
 * ambiguity, NOT proof of 0% buyer conversion or zero real clicks.
 */
export function projectCroMeasurementCoverage(row){
  const count=key=>safeNumber(row?.[key]);
  const visits=count('human_flagged_pageviews_7d');
  const ctas=count('observed_cta_events_7d');
  const daily=count('daily_cta_aggregated_7d');
  const intents=count('form_submit_intents_7d');
  const epoch=Date.parse(String(row?.evaluated_at||''));
  const observedAt=Number.isFinite(epoch)?new Date(epoch).toISOString():null;
  if(!row||visits===null||ctas===null||daily===null||intents===null||
    [visits,ctas,daily,intents].some(x=>!Number.isInteger(x)||x<0))
    return {status:'UNVERIFIED',reason:'ORIGINAL_SOURCE_COUNTS_UNAVAILABLE',observedAt,
      pageviewsNonRobotFlag7d:null,ctaEvents7d:null,formSubmitIntents7d:null,
      ctaToPageviewEventRatioPct:null,uniqueHumanVisitorsVerified:false,
      ctaClickTrackingVerified:false};
  const parity=ctas===daily;
  const missingClicks=visits>=100&&ctas===0;
  const status=!parity?'CTA_EVENT_AGGREGATION_MISMATCH':
    missingClicks?'CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS':
    ctas>0?'CTA_EVENTS_OBSERVED_NOT_BUYER_CONVERSION':'INSUFFICIENT_EVENT_EVIDENCE';
  return {status,reason:!parity?'PERSISTED_CTA_DAILY_SOURCE_INCONSISTENT':
    missingClicks?'CLICK_INSTRUMENTATION_OR_BEHAVIOR_NOT_RESOLVED':
    ctas>0?'CLICK_EVENTS_NOT_QUALIFIED_LEADS_OR_PAID_ORDERS':
    'NO_RELIABLE_CLICK_DENOMINATOR',observedAt,
    pageviewsNonRobotFlag7d:visits,ctaEvents7d:ctas,
    dailyCtaEvents7d:daily,formSubmitIntents7d:intents,
    ctaToPageviewEventRatioPct:ctas>0&&visits>0?
      Math.round(ctas/visits*10000)/100:null,
    uniqueHumanVisitorsVerified:false,
    ctaClickTrackingVerified:ctas>0&&parity,
    claim:'DESCRIPTIVE_EVENT_RATIO_ONLY_NEVER_VERIFIED_VISITOR_CONVERSION',
    nextOriginalOwner:'Powerhouse Growth/SEO CRO original event producer -> Netlify durable ACK -> original Supabase growth_events -> growth_page_daily'
  };
}

/**
 * Source-recency check for the ORIGINAL restricted 7-day CRO view.
 * last_persisted_event_at is MAX(occurred_at) from persisted events:
 * it is the event's occurrence time, NOT its insertion/ACK timestamp.
 * An old or absent event never proves the site had no visitors or that
 * Netlify queue/drain is broken. No new collector, heartbeat or writer.
 */
export function projectCroEventRecency(row,{at=new Date().toISOString()}={}){
  const unverified=(reason,extra={})=>({
    status:'UNVERIFIED',reason,lastEventOccurredAt:null,
    sourceEvaluatedAt:null,eventAgeHours:null,sourceAgeMinutes:null,
    persistedIdReadbackVerified:false,deliveryPathHealthyVerified:false,
    businessOutcomeVerified:false,...extra
  });
  const now=Date.parse(String(at||''));
  if(!Number.isFinite(now))return unverified('INVALID_OBSERVATION_CLOCK');
  if(!row||typeof row!=='object')return unverified('ORIGINAL_VIEW_UNAVAILABLE');
  const evaluated=Date.parse(String(row.evaluated_at||''));
  if(!Number.isFinite(evaluated)||evaluated>now+300000)
    return unverified('ORIGINAL_VIEW_TIMESTAMP_UNVERIFIED');
  const sourceAgeMinutes=Math.max(0,Math.floor((now-evaluated)/60000));
  const sourceEvaluatedAt=new Date(evaluated).toISOString();
  if(sourceAgeMinutes>60)return unverified('ORIGINAL_VIEW_STALE',{
    sourceEvaluatedAt,sourceAgeMinutes
  });
  const raw=row.last_persisted_event_at;
  if(raw===null||raw===undefined||raw==='')return {
    ...unverified('NO_RECORDED_EVENT_OCCURRENCE'),
    status:'NO_EVENT_TIME_RECORDED',sourceEvaluatedAt,sourceAgeMinutes
  };
  const occurred=Date.parse(String(raw));
  if(!Number.isFinite(occurred)||occurred>now+300000)
    return unverified('RECORDED_EVENT_TIME_INVALID_OR_FUTURE',{
      sourceEvaluatedAt,sourceAgeMinutes
    });
  const eventAgeHours=Math.max(0,Math.round((now-occurred)/36000)/100);
  const status=eventAgeHours>=24?'EVENT_RECENCY_EVIDENCE_DUE':
    eventAgeHours>=6?'NO_RECENT_EVENT_EVIDENCE':'RECENT_STORED_EVENT_OBSERVED';
  return {status,reason:status==='RECENT_STORED_EVENT_OBSERVED'?
    'RECORDED_OCCURRENCE_ONLY_NOT_QUEUE_OR_PROVIDER_HEALTH':
    'ORIGINAL_EVENT_SOURCE_RECENCY_REQUIRES_REAL_TRAFFIC_AND_QUEUE_READBACK',
    lastEventOccurredAt:new Date(occurred).toISOString(),sourceEvaluatedAt,
    eventAgeHours,sourceAgeMinutes,persistedIdReadbackVerified:false,
    deliveryPathHealthyVerified:false,businessOutcomeVerified:false,
    interpretation:'No recent persisted event timestamp is not evidence of zero human traffic, zero CTA use, a broken queue or revenue; confirm real consented event-ID and downstream provider receipts independently.'};
}

export function projectOtherData({daily=[],experiments=[],policies=[],conversionProof=[],experimentProof=[],behavior=[],brainProof=[],socialPosts=[],socialSnapshots=[],oneLoopAssurance=undefined,outreachActions=[],outreachResearch=[],growthDaily=[],emailReplies=[],readStates={},at=new Date().toISOString()}={}){
  const dailyOk=readStates.daily==='LIVE';
  const experimentsOk=readStates.experiments==='LIVE';
  const behaviorOk=readStates.behavior==='LIVE';
  const conversionProofOk=readStates.conversionProof==='LIVE'&&conversionProof.length===1;
  const experimentProofOk=readStates.experimentProof==='LIVE';
  const complete=dailyOk&&experimentsOk&&readStates.policies==='LIVE'&&behaviorOk&&conversionProofOk&&experimentProofOk&&(readStates.brainProof===undefined||readStates.brainProof==='LIVE');
  const oneLoop=projectCroOneLoopAssurance(oneLoopAssurance);
  const outreachRecovery=projectOutreachSourceRecovery(outreachActions,outreachResearch,{actionsStatus:readStates.outreachActions,researchStatus:readStates.outreachResearch});
  const completeWithOneLoop=complete&&(oneLoopAssurance===undefined||oneLoop.status==='READBACK_COMPLETE');
  const dailyLast=daily.reduce((latest,row)=>String(row.updated_at||'')>latest?String(row.updated_at):latest,'');
  const experimentLast=experiments.reduce((latest,row)=>String(row.updated_at||'')>latest?String(row.updated_at):latest,'');
  const behaviorLast=behavior.reduce((latest,row)=>String(row.last_observed_at||'')>latest?String(row.last_observed_at):latest,'');
  const behaviorData=behaviorOk?summarizeBehavior(behavior):null;
  const totals=dailyOk?{
    pageViews:sum(daily,'page_views'),ctaClicks:sum(daily,'cta_clicks'),
    qualifiedLeads:sum(daily,'qualified_leads'),wonOrders:sum(daily,'won_orders'),
    revenueEur:sum(daily,'revenue_eur')
  }:null;
  const websiteWeeklyGrowth=projectWebsiteWeeklyGrowth(daily,{state:readStates.daily||'UNAVAILABLE',at});
  const flags=[];
  if(websiteWeeklyGrowth.status==='UNVERIFIED')flags.push('WEEKLY_WEBSITE_GROWTH_EVIDENCE_INCOMPLETE');
  if(websiteWeeklyGrowth.status==='LOW_SAMPLE_DESCRIPTIVE_ONLY')flags.push('WEEKLY_WEBSITE_GROWTH_LOW_SAMPLE');
  if(!dailyOk)flags.push('WEBSITE_DAILY_SOURCE_UNAVAILABLE');
  if(!experimentsOk)flags.push('EXPERIMENT_SOURCE_UNAVAILABLE');
  if(readStates.policies!=='LIVE')flags.push('EXPERIMENT_POLICY_UNAVAILABLE');
  if(!behaviorOk)flags.push('BEHAVIOR_EXIT_SOURCE_UNAVAILABLE');
  if(!conversionProofOk)flags.push('PERSISTED_CONVERSION_PROOF_SOURCE_UNAVAILABLE');
  if(!experimentProofOk)flags.push('CONTROLLED_EXPERIMENT_PROOF_SOURCE_UNAVAILABLE');
  if(behaviorOk&&(!behaviorData||behaviorData.events.persisted_event_receipts===0))flags.push('NEW_EVENT_UID_READBACK_NOT_YET_VERIFIED');
  if(dailyOk&&totals.pageViews>0&&totals.ctaClicks===0)flags.push('CTA_TRACKING_NOT_VERIFIED');
  if(experimentsOk&&experiments.some(e=>!e.causal_status||e.causal_status==='insufficient_evidence'))flags.push('EXPERIMENT_EVIDENCE_INCOMPLETE');
  const socialFunnel=readStates.socialPosts==='LIVE'&&readStates.socialSnapshots==='LIVE'
    ?projectSocialCroFunnel({posts:socialPosts,snapshots:socialSnapshots,at}):null;
  if(!socialFunnel||socialFunnel.status!=='COMPARABLE_DESCRIPTIVE_METRICS')flags.push('SOCIAL_FUNNEL_48H_COMPARABLE_EVIDENCE_INSUFFICIENT');
  const brainClosure=projectCroBrainProof(readStates.brainProof==='LIVE'?brainProof:[],{at});
  const growthDirection=projectPowerhouseGrowthDirection({dailySources:growthDaily,replyEvents:emailReplies,
    socialFunnel,brainClosure,conversionProof:readStates.conversionProof==='LIVE'?conversionProof[0]:null,readStates,at});
  if(!brainClosure.technicalReadbackVerified)flags.push('ONE_BRAIN_CRO_RUNTIME_READBACK_NOT_VERIFIED');
  if(!brainClosure.businessOutcomeVerified)flags.push('CRO_COMMERCIAL_CLOSED_LOOP_NOT_PROVEN');
  if(oneLoopAssurance!==undefined&&oneLoop.status!=='READBACK_COMPLETE')flags.push('ORIGINAL_15_LOOP_ASSURANCE_UNVERIFIED');
  if(oneLoop.status==='READBACK_COMPLETE'&&oneLoop.counts.red>0)flags.push('ORIGINAL_15_LOOP_RED_GUARDS_OPEN');
  const cp=conversionProofOk?conversionProof[0]:null;
  const croMeasurement=projectCroMeasurementCoverage(cp);
  const croEventRecency=projectCroEventRecency(cp,{at});
  if(['EVENT_RECENCY_EVIDENCE_DUE','NO_RECENT_EVENT_EVIDENCE',
      'NO_EVENT_TIME_RECORDED','UNVERIFIED'].includes(croEventRecency.status))
    flags.push('CRO_EVENT_SOURCE_RECENCY_OR_READBACK_UNVERIFIED');
  if(croMeasurement.status==='CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS')
    flags.push('CTA_EVENT_GAP_REQUIRES_ORIGINAL_PRODUCER_TO_DATAHUB_READBACK');
  if(croMeasurement.status==='CTA_EVENT_AGGREGATION_MISMATCH')
    flags.push('CTA_EVENT_AGGREGATION_MISMATCH');
  if(croMeasurement.status==='UNVERIFIED')
    flags.push('CTA_DENOMINATOR_SOURCE_UNAVAILABLE');
  if(cp?.event_evidence_status!=='PERSISTED_EVENTS_OBSERVED')flags.push('PERSISTED_EVENT_PARITY_NOT_PROVEN');
  if(cp?.lead_evidence_status!=='LINKED_RECORDS_REQUIRE_INDEPENDENT_BUYER_VERIFICATION')flags.push('QUALIFIED_LEAD_READBACK_NOT_PROVEN');
  flags.push('INDEPENDENT_PAID_ORDER_VERIFICATION_REQUIRED');
  return {
    contract:'POWERHOUSE_CRO_OTHER_DATA_V1',generatedAt:at,
    scope:'canonical',status:completeWithOneLoop?'LIVE':'PARTIAL',
    oneLoop,
    outreachRecovery,
    commercialLoopStatus:brainClosure.status,
    brainClosure,
    socialFunnel,
    growthDirection,
    sources:{
      growthDaily:{status:readStates.growthDaily||'UNAVAILABLE',records:readStates.growthDaily==='LIVE'?growthDaily.length:null},
      emailReplies:{status:readStates.emailReplies||'UNAVAILABLE',records:readStates.emailReplies==='LIVE'?emailReplies.length:null},
      socialFunnel:{status:socialFunnel?.status||'UNAVAILABLE',records:socialFunnel?.channels?.reduce((a,c)=>a+c.posts_registered,0)??null},
      website:{status:readStates.daily||'UNAVAILABLE',lastObservedAt:dailyLast||null,records:dailyOk?daily.length:null},
      experiments:{status:readStates.experiments||'UNAVAILABLE',lastObservedAt:experimentLast||null,records:experimentsOk?experiments.length:null},
      policies:{status:readStates.policies||'UNAVAILABLE',records:readStates.policies==='LIVE'?policies.length:null},
      behavior:{status:readStates.behavior||'UNAVAILABLE',lastObservedAt:behaviorLast||null,records:behaviorOk?behavior.length:null},
      brainProof:{status:readStates.brainProof||'UNAVAILABLE',lastObservedAt:brainClosure.lastObservedAt,records:brainClosure.technicalReadbackVerified?1:null},
      oneLoop:{status:oneLoop.status,lastObservedAt:oneLoop.checkedAt||null,records:oneLoop.status==='READBACK_COMPLETE'?15:null},
      outreachActions:{status:readStates.outreachActions||'UNAVAILABLE',records:readStates.outreachActions==='LIVE'?outreachActions.length:null},
      outreachResearch:{status:readStates.outreachResearch||'UNAVAILABLE',records:readStates.outreachResearch==='LIVE'?outreachResearch.length:null},
      conversionProof:{status:conversionProofOk?'LIVE':readStates.conversionProof||'UNAVAILABLE',records:conversionProofOk?1:null},
      experimentProof:{status:experimentProofOk?'LIVE':readStates.experimentProof||'UNAVAILABLE',records:experimentProofOk?experimentProof.length:null}
    },
    quality:{flags,botFiltering:'UNKNOWN_IN_THIS_PROJECTION',deliveryAcknowledgement:'UNVERIFIED',message:'Website-events zijn observaties, geen onafhankelijk bevestigde leads, klanten of betaalde orders. Onbekend is nooit nul.'},
    website:totals,
    websiteWeeklyGrowth,
    behavior:behaviorData,
    croMeasurement,
    croEventRecency,
    conversionProof:cp?{
      humanFlaggedPageviews7d:safeNumber(cp.human_flagged_pageviews_7d),
      formSubmitIntents7d:safeNumber(cp.form_submit_intents_7d),
      experimentAssignments30d:safeNumber(cp.experiment_assignments_30d),
      maturedTreatment30d:safeNumber(cp.matured_treatment_30d),
      maturedHoldout30d:safeNumber(cp.matured_holdout_30d),
      sourceEvaluatedAt:cp.evaluated_at||null,
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
      'select=evaluated_at,human_flagged_pageviews_7d,event_evidence_status,lead_evidence_status,order_evidence_status,experiment_evidence_status,observed_cta_events_7d,daily_cta_aggregated_7d,form_submit_intents_7d,recorded_leads_30d,linked_qualified_lead_records_30d,orders_with_recorded_provider_readback_30d,experiment_assignments_30d,matured_treatment_30d,matured_holdout_30d,last_persisted_event_at&limit=2'),
    select(base,key,'powerhouse_cro_experiment_evidence_v1',
      'select=experiment_key,evidence_status,policy_status,primary_metric,minimum_matured_per_arm,matured_treatment,matured_holdout,last_assignment_at&limit=151'),
    select(base,key,'bg_cro_behavior_daily_v1',
      'select=day,pad,device,last_visible_section,page_events,persisted_event_receipts,historical_without_receipt,tab_sessions,scroll_reached_25,scroll_reached_50,scroll_reached_75,scroll_reached_100,observed_exits,observed_exits_under_25,form_starts,form_errors,form_abandons,whatsapp_clicks,rapid_click_heuristics,popup_exposures,experiment_exposures,last_observed_at&day=gte.'+from+'&order=day.desc&limit=5001'),
    select(base,key,'brain_records',
      'select=record_id,record_type,record_kind,owner_id,status,observed_at,executed,verified,payload&tenant_id=eq.canonical&record_id=like.cro-commercial-evidence:*&order=observed_at.desc&limit=2'),
    select(base,key,'social_posts',
      'select=tenant_id,post_id,platform,channel_kind,published_at,topic,content_pillar,format,hook_type,cta_type&tenant_id=eq.canonical&platform=eq.linkedin&channel_kind=eq.linkedin_personal&published_at=gte.'+from+'&order=published_at.desc&limit=201'),
    select(base,key,'social_posts',
      'select=tenant_id,post_id,platform,channel_kind,published_at,topic,content_pillar,format,hook_type,cta_type&tenant_id=eq.bedrijfsgeheugen&platform=in.(linkedin,instagram)&published_at=gte.'+from+'&order=published_at.desc&limit=301'),
    select(base,key,'social_metric_snapshots',
      'select=tenant_id,post_id,observed_at,data_quality,metrics&tenant_id=eq.canonical&observed_at=gte.'+from+'&data_quality=in.(OBSERVED,PROVIDER_OBSERVED)&order=observed_at.desc&limit=1201'),
    select(base,key,'social_metric_snapshots',
      'select=tenant_id,post_id,observed_at,data_quality,metrics&tenant_id=eq.bedrijfsgeheugen&observed_at=gte.'+from+'&data_quality=in.(OBSERVED,PROVIDER_OBSERVED)&order=observed_at.desc&limit=2401'),
    select(base,key,'powerhouse_sales_actions',
      'select=status,updated_at,evidence&action_type=eq.autonomous_email&channel=eq.email&updated_at=gte.'+new Date(Date.now()-30*86400000).toISOString()+'&order=updated_at.desc&limit=301'),
    select(base,key,'powerhouse_sales_actions',
      'select=status,updated_at,evidence&action_type=eq.research_enrichment&channel=eq.internal&dedupe_key=like.relationship-research:outreach-source:*&order=updated_at.desc&limit=301'),
    select(base,key,'powerhouse_growth_source_daily_v1',
      'select=metric_date,source_key,quality,metrics,source_observed_at&tenant_id=eq.bedrijfsgeheugen&metric_date=gte.'+new Date(Date.now()-16*86400000).toISOString().slice(0,10)+'&source_key=in.(website_interactions,ga4,search_console,linkedin_company_account_provider,revenue_goal)&order=metric_date.desc&limit=181'),
    select(base,key,'powerhouse_email_reply_events',
      'select=reply_event_id,occurred_at,provider,reply_class&occurred_at=gte.'+new Date(Date.now()-15*86400000).toISOString()+'&order=occurred_at.desc&limit=151')
  ];
  const responses=await Promise.allSettled([...queries,loadOneLoopAssurance({baseUrl:base,key})]);
  const assuranceResult=responses[queries.length];
  const oneLoopAssurance=assuranceResult?.status==='fulfilled'?assuranceResult.value:{status:'UNVERIFIED',reason:'ORIGINAL_15_LOOP_READ_FAILED'};
  const limits=[2000,150,50,1,150,5000,1,200,300,1200,2400,300,300,180,150];
  const stateNames=['daily','experiments','policies','conversionProof','experimentProof','behavior','brainProof','personalSocialPosts','brandSocialPosts','personalSocialSnapshots','brandSocialSnapshots','outreachActions','outreachResearch','growthDaily','emailReplies'],readStates={},datasets=[];
  for(let i=0;i<stateNames.length;i++){
    const answer=responses[i];
    const rows=answer.status==='fulfilled'?answer.value:[];
    const complete=answer.status==='fulfilled'&&rows.length<=limits[i];
    readStates[stateNames[i]]=complete?'LIVE':rows.length>limits[i]?'TRUNCATED':'UNAVAILABLE';
    datasets[i]=complete?rows:[];
  }
  readStates.socialPosts=readStates.personalSocialPosts==='LIVE'&&readStates.brandSocialPosts==='LIVE'?'LIVE':'UNAVAILABLE';
  readStates.socialSnapshots=readStates.personalSocialSnapshots==='LIVE'&&readStates.brandSocialSnapshots==='LIVE'?'LIVE':'UNAVAILABLE';
  const projection=projectOtherData({daily:datasets[0],experiments:datasets[1],policies:datasets[2],
    conversionProof:datasets[3],experimentProof:datasets[4],behavior:datasets[5],brainProof:datasets[6],
    socialPosts:[...datasets[7],...datasets[8]],socialSnapshots:[...datasets[9],...datasets[10]],
    oneLoopAssurance,outreachActions:datasets[11],outreachResearch:datasets[12],
    growthDaily:datasets[13],emailReplies:datasets[14],readStates});
  return reply(projection,projection.status==='LIVE'?200:206);
}
export const config={path:'/api/powerhouse-cro-other-data'};
