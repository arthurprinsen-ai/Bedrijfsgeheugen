const nonneg=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:(typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)?Number(v):null);
const metric=(m,key)=>m&&Object.hasOwn(m,key)?nonneg(m[key]):null;
const ms=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:null;};
const fraction=(a,b)=>a!==null&&b!==null&&b>0?Number((a/b).toFixed(4)):null;
const recentReceipt=(value,clock,hours=72)=>{const time=ms(value);return time!==null&&time<=clock+300000&&clock-time<=hours*3600000;};
const trustedPostQualities=new Set(['OBSERVED','OBSERVED_PARTIAL_SCOPE','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED']);
const trustedSourceQualities=new Set(['OBSERVED','OBSERVED_PARTIAL_SCOPE','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED']);
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
   const platform=String(item?.platform||'');
   if(!id||seen.has(id)||!['instagram','linkedin'].includes(platform))continue;
   seen.add(id);
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
   const suggestion=signals.includes('OBSERVED_ZERO_ENGAGEMENT')?'TEST_SITUATION_CONSEQUENCE_CLEAR_POINTE':
     signals.includes('OBSERVED_ZERO_COMMENTS')?'TEST_RELEVANT_NON_MANIPULATIVE_QUESTION':'COLLECT_COMPARABLE_PROVIDER_EVIDENCE';
   social.push({post_id:id,platform,format:item.format||null,hook_type:item.hook_type||null,cta_type:item.cta_type||null,
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
   source_state,source_quality:sourceMap,source_gaps:gaps,social_posts:social,website_pages:pages,
   next_day_hypotheses:actions.slice(0,6),
   action_gate:'REVIEW_IN_EXISTING_EXPERIMENT_AND_PROTECTED_PUBLICATION_LANE',
   instructions:'No inference of low views without comparable cohort; missing metrics are unknown not zero. No cause claim without experiment, and no revenue without paid order readback.',
   source_owner:'canonical Supabase and existing content growth learning; no second scheduler',
   privacy:'brand posts and consented nonrobot page aggregates only'
 };
}