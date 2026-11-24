import {buildChannelTrends,socialChannel} from './social-funnel-trend.mjs';
import {selectPersonalGrowthMethod,selectCompanyContentVariation,PERSONAL_GROWTH_METHODS} from '../../brain/creative/revenue-content-intelligence.mjs';

const personalMethods=new Set(PERSONAL_GROWTH_METHODS);
const publishedHistory=(rows,channel,proof,at)=>rows.filter(row=>socialChannel(row)===channel&&row[proof]===true&&/^urn:li:(share|ugcPost):[0-9]+$/.test(String(row.external_post_id||''))&&ms(row.published_at)!==null&&ms(row.published_at)<=at.getTime()).sort((a,b)=>ms(b.published_at)-ms(a.published_at)).filter((row,i,all)=>all.findIndex(x=>x.external_post_id===row.external_post_id)===i).slice(0,6);
const strictCount=value=>Number.isInteger(value)&&value>=0?value:null;
export function diagnosePersonalGrowth(evidence={},at=new Date()){
 const rows=Array.isArray(evidence.social)?evidence.social.slice(0,300):[];
 const owned=rows.filter(row=>socialChannel(row)==='linkedin_personal');
 const cohortId='canonical:linkedin_personal:text_story:48h';
 const observations=[];
 if(evidence.state==='READ_ONLY_PROVIDER_OBSERVED'){
  for(const row of owned){
   const published=ms(row.published_at), observed=ms(row.trend_observed_at);
   if(published===null||observed===null||observed>at.getTime()||at.getTime()-published<54*3600000||at.getTime()-published>180*86400000||observed-published<42*3600000||observed-published>54*3600000)continue;
   if(!/^urn:li:(share|ugcPost):[0-9]+$/.test(String(row.external_post_id||''))||row.personal_publication_verified!==true||!['OBSERVED','PROVIDER_OBSERVED'].includes(row.trend_data_quality)||typeof row.trend_source_event_id!=='string'||!row.trend_source_event_id.trim()||row.format!=='text_story'||!personalMethods.has(row.hook_type))continue;
   const impressions=strictCount(row.trend_metrics?.impressions),substantiveComments=strictCount(row.trend_metrics?.substantive_comments);
   if(impressions===null||impressions===0||substantiveComments===null||row.trend_metrics?.impressions_unavailable===true||row.trend_metrics?.substantive_comments_unavailable===true)continue;
   observations.push({channel:'linkedin_personal',cohortId,format:'text_story',windowHours:48,providerReadbackVerified:true,providerPostId:row.external_post_id,method:row.hook_type,impressions,substantiveComments});
  }
 }
 const seed=at.toISOString().slice(0,10);
 // Scheduled exploration prevents a descriptive candidate from becoming a permanent default.
 const mode=Math.floor(at.getTime()/86400000)%5===0?'EXPLORE':'EXPLOIT';
 const recentMethods=evidence.state==='READ_ONLY_PROVIDER_OBSERVED'?publishedHistory(owned,'linkedin_personal','personal_publication_verified',at).map(row=>row.hook_type):[];
 const hypothesis=selectPersonalGrowthMethod({mode,seed,cohortId,observations,recentMethods});
 return {channel:'linkedin_personal',registered_posts:owned.length,explicit_method_tags:owned.filter(row=>personalMethods.has(row.hook_type)).length,eligible_observations:observations.length,cohortId,hypothesis,recentMethods,
  next_action:'HANDOFF_TO_ORIGINAL_PERSONAL_EDITOR_FOR_UNUSED_VERIFIED_SOURCE',measurement_gate:'EXACT_PROVIDER_URN_AND_OBSERVED_SUBSTANTIVE_COMMENTS_AND_IMPRESSIONS',learning_applied:false,authorizesPublication:false};
}
export function diagnoseCompanyContentVariation(evidence={},at=new Date()){
 const rows=Array.isArray(evidence.social)?evidence.social.slice(0,300):[];
 const history=evidence.state==='READ_ONLY_PROVIDER_OBSERVED'?publishedHistory(rows,'linkedin_company','company_publication_verified',at):[];
 const recentFormats=history.map(row=>row.format),recentFamilies=history.map(row=>row.narrative_type);
 return {channel:'linkedin_company',recentFormats,recentFamilies,variation:selectCompanyContentVariation({seed:at.toISOString().slice(0,10),recentFormats,recentFamilies}),next_action:'ORIGINAL_COMPANY_EDITOR_VERIFY_SOURCE_AND_SUPPORTED_FORMAT',learning_applied:false,authorizesPublication:false};
}
const nonneg=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:(typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)?Number(v):null);
const metric=(m,key)=>m&&Object.hasOwn(m,key)?nonneg(m[key]):null;
const ms=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:null;};
const fraction=(a,b)=>a!==null&&b!==null&&b>0?Number((a/b).toFixed(4)):null;
const recentReceipt=(value,clock,hours=72)=>{const time=ms(value);return time!==null&&time<=clock+300000&&clock-time<=hours*3600000;};
const trustedPostQualities=new Set(['OBSERVED','OBSERVED_PARTIAL_SCOPE','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED']);
const trustedSourceQualities=new Set(['OBSERVED','OBSERVED_PARTIAL_SCOPE','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED']);

// Mandatory KPI coverage for both existing LinkedIn owners. Post snapshots are
// cumulative post counters, not daily account totals or deduplicated audience reach.
export const LINKEDIN_KPI_CONTRACT=Object.freeze([
 ['impressions_unique_reach','DAILY','original_social_analytics',['impressions','reach']],
 ['substantive_comments','DAILY','original_social_analytics',['substantive_comments']],
 ['shares_saves','DAILY','original_social_analytics',['shares','saved']],
 ['profile_page_visits','DAILY','original_social_analytics',[]],
 ['follower_growth','WEEKLY','original_social_analytics',[]],
 ['qualified_conversations','DAILY','original_relationship_revenue',[]],
 ['intake_meetings','WEEKLY','original_relationship_revenue',[]],
 ['customer_conversion','WEEKLY','original_growth_revenue',[]],
 ['attributed_revenue','MONTHLY','original_growth_revenue',[]],
 ['growth_technique_effect','PER_EXPERIMENT','original_content_learning',[]]
].map(([key,frequency,owner,postMetrics])=>Object.freeze({key,frequency,owner,postMetrics:Object.freeze(postMetrics)})));
export function diagnoseLinkedInKpiCoverage(evidence={},at=new Date()){
 const rows=Array.isArray(evidence.social)?evidence.social.slice(0,300):[];
 return ['linkedin_personal','linkedin_company'].map(channel=>{
  const proof=channel==='linkedin_personal'?'personal_publication_verified':'company_publication_verified';
  const owned=rows.filter(row=>socialChannel(row)===channel);
  const recent=evidence.state==='READ_ONLY_PROVIDER_OBSERVED'?owned.filter(row=>{
   const observed=ms(row.observed_at),published=ms(row.published_at);
   return row[proof]===true&&/^urn:li:(share|ugcPost):[0-9]+$/.test(String(row.external_post_id||''))&&typeof row.source_event_id==='string'&&row.source_event_id.trim()&&['OBSERVED','PROVIDER_OBSERVED'].includes(row.data_quality)&&published!==null&&observed!==null&&observed>=published&&observed<=at.getTime()&&at.getTime()-observed<=24*3600000;
  }):[];
  const unique=recent.filter((row,i,all)=>all.filter(x=>x.external_post_id===row.external_post_id).length===1);
  const kpis=LINKEDIN_KPI_CONTRACT.map(({key,frequency,owner,postMetrics})=>{
   const coverage=Object.fromEntries(postMetrics.map(metric=>[metric,unique.filter(row=>row.metrics?.[metric+'_unavailable']!==true&&strictCount(row.metrics?.[metric])!==null).length]));
   const complete=postMetrics.length?unique.filter(row=>postMetrics.every(metric=>row.metrics?.[metric+'_unavailable']!==true&&strictCount(row.metrics?.[metric])!==null)).length:0;
   return {key,frequency,owner,value:null,post_metric_coverage:coverage,complete_post_samples:complete,
    state:postMetrics.length?(complete?'POST_SNAPSHOTS_AVAILABLE_PERIOD_TOTAL_UNVERIFIED':'MISSING_OR_PARTIAL_POST_EVIDENCE'):'ORIGINAL_OWNER_PERIOD_EVIDENCE_REQUIRED',
    next_action:postMetrics.length?'VERIFY_PROVIDER_PERIOD_AND_COVERAGE':'REQUIRE_ORIGINAL_OWNER_PERIOD_RECEIPT',
    // Do not sum cumulative reach, substitute comments for substantive comments,
    // or attribute customer/revenue outcomes from likes or clicks.
    coverage_is_not_kpi_result:true};
  });
  return {channel,kpis,verified_recent_post_snapshots:unique.length,registered_posts:owned.length,all_kpis_proven:false,authorizesPublication:false};
 });
}

export function diagnoseDailyPerformance({evidence={},now=new Date()}={}){
 const at=now instanceof Date?now:new Date(now);
 if(Number.isNaN(at.getTime()))throw Error('INVALID_DIAGNOSTIC_CLOCK');
 const source_state=evidence.state||'NOT_COLLECTED';
 const authoritative=source_state==='READ_ONLY_PROVIDER_OBSERVED';
 const social=[],pages=[],actions=[],gaps=[];
 const sourceMap=Object.fromEntries((Array.isArray(evidence.sources)?evidence.sources:[])
   .filter(x=>['ga4','search_console','website_interactions','instagram','linkedin'].includes(x.source_key))
   .map(x=>[x.source_key,{quality:x.quality||'UNKNOWN',observed_at:x.source_observed_at||null}]));
 for(const key of ['ga4','search_console','website_interactions','instagram','linkedin']){
   const source=sourceMap[key];
   const reason=!authoritative?'PROVIDER_READBACK_UNAVAILABLE':
     !source?'SOURCE_MISSING':
     source.quality==='OBSERVED_LEGACY'?'LEGACY_AGGREGATE_NOT_VERIFIED':
     !trustedSourceQualities.has(source.quality)?'SOURCE_QUALITY_NOT_VERIFIED':
     !recentReceipt(source.observed_at,at.getTime(),key==='search_console'?168:72)?'STALE_OR_FUTURE_SOURCE_RECEIPT':
     source.quality==='OBSERVED_PARTIAL_SCOPE'?'PARTIAL_SOURCE_COVERAGE':null;
   if(reason)gaps.push({source:key,quality:source?.quality||'NOT_OBSERVED',reason,action:'VERIFY_OR_REPAIR_CANONICAL_PROVIDER_READBACK'});
 }
 const seen=new Set();
 for(const item of (Array.isArray(evidence.social)?evidence.social:[]).slice(0,300)){
   const id=String(item?.post_id||'');
   const tenantId=String(item?.tenant_id||'bedrijfsgeheugen');
   const platform=String(item?.platform||'');
   const identity=tenantId+':'+id;
   if(!id||seen.has(identity)||!['instagram','linkedin'].includes(platform))continue;
   seen.add(identity);
   const age=ms(item.published_at),observed=ms(item.observed_at);
   const mature=age!==null&&at.getTime()-age>=86400000;
   const fresh=recentReceipt(item.observed_at,at.getTime())&&observed>=age;
   const status=String(item.data_quality||'MISSING');
   const observedSource=authoritative&&mature&&fresh&&trustedPostQualities.has(status);
   const m=observedSource&&item.metrics&&typeof item.metrics==='object'?item.metrics:{};
   const views=m.views_unavailable===true?null:metric(m,'views'),reach=m.reach_unavailable===true?null:metric(m,'reach'),likes=metric(m,'likes'),
     comments=metric(m,'comments'),reactions=metric(m,'reactions'),
     saved=metric(m,'saved'),shares=metric(m,'shares');
   const exposure=reach??views;
   const engagement=comments!==null&&likes!==null?comments+likes+(saved||0)+(shares||0):reactions;
   const rate=fraction(engagement,exposure);
   const signals=[];
   if(!observedSource)signals.push('MISSING_STALE_OR_IMMATURE_PROVIDER_OBSERVATION');
   if(views===null)signals.push('VIEWS_UNAVAILABLE');
   if(comments===null)signals.push('COMMENTS_UNAVAILABLE');
   if(observedSource&&exposure!==null&&exposure>=50&&comments===0)signals.push('OBSERVED_ZERO_COMMENTS');
   if(observedSource&&exposure!==null&&exposure>=50&&engagement===0)signals.push('OBSERVED_ZERO_ENGAGEMENT');
   const channel=socialChannel({...item,tenant_id:tenantId});
   const suggestion=channel==='linkedin_personal'?'USE_SOURCE_LED_PERSONAL_GROWTH_HYPOTHESIS':signals.includes('OBSERVED_ZERO_ENGAGEMENT')?'TEST_SITUATION_CONSEQUENCE_CLEAR_POINTE':
     signals.includes('OBSERVED_ZERO_COMMENTS')?'TEST_RELEVANT_NON_MANIPULATIVE_QUESTION':'COLLECT_COMPARABLE_PROVIDER_EVIDENCE';
   const localTime=age===null?null:new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',weekday:'long',hour:'2-digit',hourCycle:'h23'}).format(new Date(age));
   social.push({tenant_id:tenantId,post_id:id,platform,channel,published_at:item.published_at||null,published_day_hour_nl:localTime,
     topic:item.topic||null,content_pillar:item.content_pillar||null,narrative_type:item.narrative_type||null,
     format:item.format||null,hook_type:item.hook_type||null,cta_type:item.cta_type||null,
     views,reach,likes,comments,reactions,saved,shares,engagement_rate:rate,provider_quality:status,
     observed_at:item.observed_at||null,signals,suggestion,
     not_a_causal_explanation:true,conversion_outcome:'UNKNOWN_UNLESS_ATTRIBUTED'});
   if(suggestion.startsWith('TEST_'))actions.push({scope:'social',identity:id,hypothesis:suggestion,
      test:'One bounded topic-matched hook, concrete problem/consequence/pointe and useful CTA experiment',
      next_measurement:'same-platform mature provider engagement plus attributed qualified leads/orders'});
 }
 for(const item of (Array.isArray(evidence.pages)?evidence.pages:[]).slice(0,300)){
   const path=item?.page_path;
   if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.includes('?')||path.includes('\\')||path.length>240)continue;
   const sessions=nonneg(item.human_page_sessions),click_sessions=nonneg(item.human_click_sessions);
   const websiteSource=sourceMap.website_interactions;
   const verifiedRecentHumanEvents=authoritative&&recentReceipt(item.observed_at,at.getTime())&&
     trustedSourceQualities.has(websiteSource?.quality)&&recentReceipt(websiteSource?.observed_at,at.getTime());
   const enough=verifiedRecentHumanEvents&&sessions!==null&&sessions>=20;
   const hypothesis=enough&&click_sessions===0?'TEST_PAGE_MESSAGE_AND_PRIMARY_CTA':'COLLECT_CTA_AND_QUALIFIED_CONVERSION_EVENTS';
   pages.push({path,url:'https://www.bedrijfsgeheugen.nl'+path,human_page_sessions:sessions,human_click_sessions:click_sessions,
     click_session_ratio:fraction(click_sessions,sessions),hypothesis,
     verified_recent_human_events:Boolean(verifiedRecentHumanEvents),
     observed_at:item.observed_at||null,attribution:'CONSENTED_NONROBOT_EVENTS_ONLY',sales_and_dropoff_not_inferred:true});
   if(hypothesis.startsWith('TEST_'))actions.push({scope:'website',identity:path,hypothesis,
     test:'Compare one reversible intent-aligned proof/CTA change; retain control',
     next_measurement:'qualified leads and paid orders with validated event linkage'});
 }
 return {
   contract:'POWERHOUSE-DAILY-POST-BLOG-CONVERSION-DIAGNOSTICS-v1',generated_at:at.toISOString(),
   source_state,source_quality:sourceMap,source_gaps:gaps,social_posts:social,
   social_channel_trends:buildChannelTrends(evidence.social,{now:at}),personal_growth:diagnosePersonalGrowth(evidence,at),company_content_variation:diagnoseCompanyContentVariation(evidence,at),linkedin_kpi_coverage:diagnoseLinkedInKpiCoverage(evidence,at),website_pages:pages,
   next_day_hypotheses:actions.slice(0,6),
   action_gate:'REVIEW_IN_EXISTING_EXPERIMENT_AND_PROTECTED_PUBLICATION_LANE',
   instructions:'No inference of low views without comparable cohort; missing metrics are unknown not zero. No cause claim without experiment, and no revenue without paid order readback.',
   source_owner:'canonical Supabase and existing content growth learning; no second scheduler',
   privacy:'brand posts and consented nonrobot page aggregates only'
 };
}