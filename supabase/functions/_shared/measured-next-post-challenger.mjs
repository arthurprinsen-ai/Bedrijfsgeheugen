/** Read-only tactical challenger decision for the EXISTING brand publisher.
 * Does not invent customer intent, publish, award wins or write another learning database. */
const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:
  typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)?Number(v):null;
const instant=x=>{const t=Date.parse(String(x||''));return Number.isFinite(t)?t:null;};
export function selectMeasuredNextPostTest({posts=[],snapshots=[],now=new Date(),channel='linkedin_company'}={}){
 const date=now instanceof Date?now:new Date(now);
 if(Number.isNaN(date.getTime()))throw new TypeError('MEASURED_CREATIVE_INVALID_CLOCK');
 if(!Array.isArray(posts)||!Array.isArray(snapshots))throw new TypeError('MEASURED_CREATIVE_SOURCE_ARRAYS_REQUIRED');
 if(!['linkedin_company','instagram_company'].includes(channel))throw new TypeError('MEASURED_CREATIVE_CHANNEL_INVALID');
 const sample=posts.filter(p=>p?.tenant_id==='bedrijfsgeheugen'
   &&(channel==='instagram_company'?(p?.platform==='instagram'&&['instagram_business','instagram_company'].includes(p?.channel_kind))
     :(p?.platform==='linkedin'&&p?.channel_kind==='linkedin_company'))
   &&typeof p.post_id==='string'&&p.post_id.length<220&&instant(p.published_at)!==null
   &&date.getTime()-instant(p.published_at)>=24*3600000
   &&date.getTime()-instant(p.published_at)<=21*86400000).slice(0,24);
 const ids=new Set(sample.map(p=>p.post_id));
 const originalIgMediaByPost=new Map(sample.filter(p=>p.platform==='instagram')
   .map(p=>[p.post_id,String(p.external_post_id||'')]));

 const recent=snapshots.filter(s=>s?.tenant_id==='bedrijfsgeheugen'&&ids.has(s.post_id)
   &&(channel==='instagram_company'
     ?s.source==='composio-instagram'&&s.data_quality==='OBSERVED'
       &&/^[0-9]{10,25}$/.test(originalIgMediaByPost.get(s.post_id)||'')
       &&String(s.source_event_id||'').startsWith('composio:instagram:'+originalIgMediaByPost.get(s.post_id)+':')
     :['OBSERVED','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED'].includes(s.data_quality))
   &&instant(s.observed_at)!==null
   &&date.getTime()-instant(s.observed_at)<=72*3600000
   &&date.getTime()-instant(s.observed_at)>=-300000)
   .sort((a,b)=>instant(b.observed_at)-instant(a.observed_at));
 const newest=new Map();
 for(const s of recent)if(!newest.has(s.post_id))newest.set(s.post_id,s);
 const qualifying=[];
 for(const p of sample){
   const s=newest.get(p.post_id);
   if(!s||instant(s.observed_at)<instant(p.published_at))continue;
   const metrics=s.metrics;
   if(!metrics||typeof metrics!=='object'||metrics.metric_scope==='reactions_only'||metrics.views_unavailable===true)continue;
   const exposure=number(metrics.reach)??number(metrics.views)??number(metrics.impressions);
   const comments=number(metrics.comments),likes=number(metrics.likes);
   if(exposure===null||exposure<50||
     (channel!=='instagram_company'&&(comments===null||likes===null)))continue;
   const clicks=number(metrics.clicks)??number(metrics.link_clicks);
   const shares=number(metrics.shares),saved=number(metrics.saved);
   qualifying.push({post_id:p.post_id,exposure,comments,likes,clicks,
     shares,saved,views:number(metrics.views),reach:number(metrics.reach),
     observed_at:s.observed_at});
 }
 const base={contract:'POWERHOUSE-MEASURED-NEXT-POST-CHALLENGER-v1',
  evidence_scope:channel==='instagram_company'?'SAME_OWNED_BRAND_INSTAGRAM_ONLY':'SAME_OWNED_BRAND_LINKEDIN_COMPANY_ONLY',mode:'READ_ONLY_DECISION_CONTEXT',
  eligible_published_posts:sample.length,verified_comparable_posts:qualifying.length,
  hypothesis_not_caused_or_proven:true,source_owner:'public.social_posts and public.social_metric_snapshots',
  execution_authority:'existing powerhouse-content-orchestrator and protected social publisher',
  minimum_distinct_posts:2,minimum_cumulative_exposure:200,
  privacy:'only aggregate provider metrics; no visitor or reacting-person identifiers',
  requires_future_readback:['exact provider published identity','mature comparable impressions and comments','attributed qualified customers or paid orders where observable']};
 const reach=qualifying.reduce((a,x)=>a+x.exposure,0);
 const comments=qualifying.reduce((a,x)=>a+(x.comments??0),0);
 // Only observed Instagram owned-post metrics; never infer missing shares,
 // saves, UTM clicks, leads or revenue from a raw view count. One snapshot
 // per exact provider post and no LinkedIn/Buffer cross-account transfer.
 const metricCoverage=(key)=>{
   const rows=qualifying.filter(x=>x[key]!==null);
   const exposure=rows.reduce((n,x)=>n+x.exposure,0);
   return {sample:rows.length,exposure,value:rows.length?rows.reduce((n,x)=>n+x[key],0):null};
 };
 const instagramEvidence=channel==='instagram_company'?{
   source:'composio-instagram',scope:'OWNED_ORGANIC_POST_MEDIA',
   status:qualifying.length>=2&&reach>=200?'COMPARABLE_AGGREGATE_OBSERVED':'INSUFFICIENT_MATURED_POSTS',
   no_new_post_or_budget:true,causal_effect_proven:false,sales_not_inferred:true,
   measured_posts:qualifying.length,observed_at:qualifying[0]?.observed_at||null,
   reach_exposure_sum:metricCoverage('reach'),
   views:metricCoverage('views'),likes:metricCoverage('likes'),
   comments:metricCoverage('comments'),shares:metricCoverage('shares'),
   saves:metricCoverage('saved'),website_clicks:metricCoverage('clicks'),
   paid_orders:'UNKNOWN_UNTIL_INDEPENDENT_ATTRIBUTION'
 }:null;
 if(qualifying.length<2||reach<200)return {...base,state:'WAIT_FOR_COMPARABLE_PROVIDER_METRICS',
    reason:'No two independently comparable mature posts on the same owned platform with trustworthy exposure',
    cumulative_verified_exposure:reach,instagram_business_evidence:instagramEvidence,
    proposed_test:null,decision:'KEEP_CANONICAL_EDITORIAL_DEFAULT'};
 const clickCohort=qualifying.filter(x=>x.clicks!==null);
 const clickExposure=clickCohort.reduce((a,x)=>a+x.exposure,0);
 const verifiedClicks=clickCohort.reduce((a,x)=>a+x.clicks,0);
 const zeroClicks=clickCohort.length>=2&&clickExposure>=200&&verifiedClicks===0;
 const share=instagramEvidence?.shares,save=instagramEvidence?.saves;
 // Only an explicit observed zero is a zero. Low sharing and low saving
 // suggest one reversible copy hypothesis, not a causal algorithm claim.
 const shareGap=channel==='instagram_company'&&share?.sample>=2&&share.exposure>=200
   &&share.value/share.exposure<0.005;
 const saveGap=channel==='instagram_company'&&save?.sample>=2&&save.exposure>=200
   &&save.value/save.exposure<0.0075;
 const candidate=zeroClicks?'TEST_USEFUL_NEXT_STEP_FOR_ZERO_CLICKS':
   shareGap?'TEST_SHAREABLE_CONCRETE_BUSINESS_FRICTION':
   saveGap?'TEST_ONE_SAVEABLE_OWNER_CHECK':
   comments===0?'TEST_RELEVANT_CUSTOMER_DISCUSSION_QUESTION':
    comments/reach<0.005?'TEST_CONCRETE_PROBLEM_CONSEQUENCE_HOOK':'TEST_CONCRETE_NEXT_STEP_CTA';
 return {...base,state:'ELIGIBLE_BOUNDED_NEXT_POST_TEST',
   cumulative_verified_exposure:reach,cumulative_comments:comments,
   instagram_business_evidence:instagramEvidence,
   cumulative_verified_clicks:clickCohort.length?verifiedClicks:null,verified_click_exposure:clickExposure,
   source_post_ids:qualifying.map(x=>x.post_id).slice(0,5),
   proposed_test:{
      hypothesis_id:candidate,
      single_change:zeroClicks?'Clarify one useful voluntary next step and its concrete reader benefit; preserve the topic, verified destination and other copy; no clickbait or extra post':
       shareGap?'Change only the opening to one specific, source-backed MKB friction and its relatable consequence worth sharing with a colleague, without asking for artificial engagement':
       saveGap?'Make one concrete, actionable owner/checklist step in the existing Mira caption easier to save; preserve the exact source, master video scene and lawful optional CTA':
       comments===0?'Use one useful open question tied to a concrete customer situation; do not use engagement bait':
       comments/reach<0.005?'Replace one generic opening with a concrete operational problem and consequence':
       'Make one relevant next step explicit without pressure or unverified outcome claims',
      primary_metric:zeroClicks?'provider_observed_clicks_per_eligible_exposure':shareGap?'provider_observed_shares_per_reach':saveGap?'provider_observed_saves_per_reach':'provider_observed_comments_per_eligible_exposure',
      commercial_guardrail:'never trade off qualified leads, truth, consent or customer trust for likes',
      treatment:'ONE_REVERSIBLE_CREATIVE_COMPONENT_ONLY',
      control:'retain current source-backed editorial contract and topic',
      promotion_policy:'No causal winning pattern until canonically approved comparison and mature independently observed outcomes',
      evaluation_horizons_hours:[24,48,72]
   },decision:'SUGGEST_CHALLENGER_IN_EXISTING_EDITORIAL_GENERATION_NO_AUTONOMOUS_WIN_PROMOTION'};
}


/** Daily controlled exploration WHEN no calibrated comparable provider cohort
 * exists. This is a single copy hypothesis, never a causal winner. */
export function proposeBoundedCreativeExploration({runDate,channel,recommendation,measured={state:'NOT_APPLICABLE'},freshness={ok:true}}={}){
 const base={contract:'POWERHOUSE-DAILY-CREATIVE-EXPLORATION-v1',state:'NO_EXPLORATION',
   causal_lift_proven:false,commercial_outcome:'UNKNOWN',
   execution_owner:'existing canonical content orchestrator and protected publisher',
   additional_publications:0};
 if(!['blog','linkedin_company','instagram_company'].includes(channel))return {...base,reason:'CHANNEL_EXCLUDED'};
 const stamp=Date.parse(String(runDate||'')+'T00:00:00Z');
 if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==runDate)return {...base,reason:'DATE_INVALID'};
 if(freshness?.ok!==true)return {...base,reason:'SOURCE_NOT_CURRENT_OR_VERIFIED'};
 if(measured?.state==='ELIGIBLE_BOUNDED_NEXT_POST_TEST')return {...base,reason:'MEASURED_CHALLENGER_ALREADY_OWNS_EXPERIMENT'};
 if(measured?.state==='SOURCE_UNAVAILABLE')return {...base,reason:'PROVIDER_SOURCE_UNAVAILABLE'};
 if(!recommendation?.reason||!recommendation?.evidence||typeof recommendation.evidence!=='object'||Array.isArray(recommendation.evidence)||Object.keys(recommendation.evidence).length===0)
   return {...base,reason:'CANONICAL_RECOMMENDATION_EVIDENCE_REQUIRED'};
 const company=[
  {name:'FIRST_SENTENCE',change:'Maak uitsluitend de eerste zin een herkenbare, concrete ondernemer-situatie. Behoud overige bronclaims, onderwerp en CTA.'},
  {name:'CONSEQUENCE',change:'Maak één al ondersteund concreet tijd-, geld- of risicogevolg explicieter. Verzin geen cijfers of klantcases.'},
  {name:'USEFUL_NEXT_ACTION',change:'Maak één vrijwillige, bruikbare vervolgstap begrijpelijker, zonder druk of onbewezen productclaim.'}
 ];
 const blog=[
  {name:'READER_QUESTION',change:'Maak één tussenkop een duidelijke vraag van de lezer, gebaseerd op hetzelfde bronprobleem.'},
  {name:'EXAMPLE',change:'Verduidelijk één stap met een uitdrukkelijk hypothetisch ondernemer-voorbeeld zonder verzonnen statistiek of case.'},
  {name:'READERS_NEXT_STEP',change:'Maak één optionele, brongetrouwe vervolgstap concreter zonder conversiedruk.'}
 ];
 const instagram=[
  {name:'SCENE_HOOK',metric:'provider_observed_shares_per_reach',
   change:'Verduidelijk uitsluitend de opening van de bestaande fictieve Mira-scène met één herkenbare, bronvaste ondernemersfrictie; geen nepklantcase of engagementbait.'},
  {name:'CONSEQUENCE',metric:'provider_observed_saves_per_reach',
   change:'Verhelder uitsluitend één concreet mogelijk gevolg of bruikbare eigenaar/controlehandeling van de bronvaste ondernemersfrictie; behoud de bestaande Mira-scène.'},
  {name:'RELEVANT_QUESTION',metric:'provider_observed_comments_per_reach',
   change:'Stel uitsluitend één natuurlijke nuttige vraag bij het probleem, zonder likes, delen of reageren af te dwingen.'}
 ];
 const variants=channel==='blog'?blog:channel==='instagram_company'?instagram:company;
 const choice=variants[Math.floor(stamp/86400000)%variants.length];
 return {...base,state:'ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS',channel,run_date:runDate,
   source_recommendation_id:String(recommendation.recommendation_id||'')||null,
   hypothesis_id:channel+':'+choice.name+':'+runDate,
   single_change:choice.change,
   other_components:'UNCHANGED',experiment_type:'OBSERVATIONAL_SINGLE_CANDIDATE_NOT_RANDOMIZED_AB',
   compare_to:'prior channel-native editorial baseline; no causal inference',
   measure_after_days:[1,3,7,30],
   lead_metric:channel==='blog'?'verified_qualified_cta_progression':channel==='instagram_company'?choice.metric:'verified_clicks_and_substantive_comments',
   primary_business_metric:'attributed_verified_paid_orders',
   requires_readback:true,control:'never promote a winner from unknown denominators',
   ...(channel==='instagram_company'?{format_policy:'MIRA_REEL_ONLY_UNTIL_INDEPENDENT_CAROUSEL_ASSET_AUTHORITY',
     format_learning_note:'Third-party 2026 comparisons suggest carousels may earn more saves, but the existing exact Mira Reel visual gate is not bypassed and no extra post is permitted.',
     provider_metrics_only:true,causal_effect_proven:false}: {})};
}


/** Single-experiment arbitration for the EXISTING content owner.
 * Source choices are read-only; this never opens experiments or changes data.
 * A still-running original LinkedIn one-variable experiment must preempt
 * optional challenger/exploration copy in the same post, preventing
 * multi-variable confounding and false self-learning. */
export function arbitrateOriginalEditorialExperiment({channel,linkedinLoop,measured,creative}={}){
 const originalActive=['linkedin_company','linkedin_personal'].includes(channel)
   &&['EXPERIMENT_LOOPT','NIEUW_EXPERIMENT'].includes(linkedinLoop?.state)
   &&typeof linkedinLoop?.instructie==='string'
   &&linkedinLoop.instructie.trim().length>0;
 const measuredCandidate=measured&&typeof measured==='object'?measured:{state:'NOT_APPLICABLE'};
 const creativeCandidate=creative&&typeof creative==='object'?creative:{state:'NO_EXPLORATION'};
 const suppressMeasured=reason=>({...measuredCandidate,state:'SUPPRESSED_BY_SINGLE_EXPERIMENT_OWNER',
   previous_state:measuredCandidate.state,decision:'KEEP_ORIGINAL_SINGLE_EXPERIMENT',
   proposed_test:null,reason});
 const suppressCreative=reason=>({...creativeCandidate,state:'NO_EXPLORATION',
   previous_state:creativeCandidate.state,reason,hypothesis_id:null,single_change:null});
 if(originalActive)return {
   owner:'ORIGINAL_LINKEDIN_LOOP',experiment_id:linkedinLoop.experiment_id||null,
   measured:suppressMeasured('ACTIVE_SOURCE_REGISTERED_LINKEDIN_ONE_VARIABLE_EXPERIMENT'),
   creative:suppressCreative('ORIGINAL_LINKEDIN_EXPERIMENT_PREEMPTS_NEW_EXPLORATION'),
   max_distinct_experimental_copy_changes:1,causal_effect_proven:false
 };
 if(measuredCandidate.state==='ELIGIBLE_BOUNDED_NEXT_POST_TEST')return {
   owner:'EXISTING_MEASURED_CHALLENGER',experiment_id:null,
   measured:measuredCandidate,
   creative:suppressCreative('MEASURED_CHALLENGER_PREEMPTS_DAILY_EXPLORATION'),
   max_distinct_experimental_copy_changes:1,causal_effect_proven:false
 };
 if(creativeCandidate.state==='ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS')return {
   owner:'EXISTING_DAILY_EXPLORATION',experiment_id:null,
   measured:measuredCandidate,creative:creativeCandidate,
   max_distinct_experimental_copy_changes:1,causal_effect_proven:false
 };
 return {owner:'NO_NEW_EXPERIMENT',experiment_id:null,measured:measuredCandidate,
   creative:creativeCandidate,max_distinct_experimental_copy_changes:0,causal_effect_proven:false};
}
