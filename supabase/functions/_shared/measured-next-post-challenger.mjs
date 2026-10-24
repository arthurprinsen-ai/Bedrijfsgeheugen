/** Read-only tactical challenger decision for the EXISTING brand publisher.
 * Does not invent customer intent, publish, award wins or write another learning database. */
const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:
  typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)?Number(v):null;
const instant=x=>{const t=Date.parse(String(x||''));return Number.isFinite(t)?t:null;};
export function selectMeasuredNextPostTest({posts=[],snapshots=[],now=new Date()}={}){
 const date=now instanceof Date?now:new Date(now);
 if(Number.isNaN(date.getTime()))throw new TypeError('MEASURED_CREATIVE_INVALID_CLOCK');
 if(!Array.isArray(posts)||!Array.isArray(snapshots))throw new TypeError('MEASURED_CREATIVE_SOURCE_ARRAYS_REQUIRED');
 const sample=posts.filter(p=>p?.tenant_id==='bedrijfsgeheugen'&&p?.platform==='linkedin'&&p?.channel_kind==='linkedin_company'
   &&typeof p.post_id==='string'&&p.post_id.length<220&&instant(p.published_at)!==null
   &&date.getTime()-instant(p.published_at)>=24*3600000
   &&date.getTime()-instant(p.published_at)<=21*86400000).slice(0,24);
 const ids=new Set(sample.map(p=>p.post_id));
 const recent=snapshots.filter(s=>s?.tenant_id==='bedrijfsgeheugen'&&ids.has(s.post_id)
   &&['OBSERVED','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED'].includes(s.data_quality)
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
   if(exposure===null||exposure<50||comments===null||likes===null)continue;
   qualifying.push({post_id:p.post_id,exposure,comments,likes,observed_at:s.observed_at});
 }
 const base={contract:'POWERHOUSE-MEASURED-NEXT-POST-CHALLENGER-v1',
  evidence_scope:'SAME_OWNED_BRAND_LINKEDIN_COMPANY_ONLY',mode:'READ_ONLY_DECISION_CONTEXT',
  eligible_published_posts:sample.length,verified_comparable_posts:qualifying.length,
  hypothesis_not_caused_or_proven:true,source_owner:'public.social_posts and public.social_metric_snapshots',
  execution_authority:'existing powerhouse-content-orchestrator and protected social publisher',
  minimum_distinct_posts:2,minimum_cumulative_exposure:200,
  privacy:'only aggregate provider metrics; no visitor or reacting-person identifiers',
  requires_future_readback:['exact provider published identity','mature comparable impressions and comments','attributed qualified customers or paid orders where observable']};
 const reach=qualifying.reduce((a,x)=>a+x.exposure,0);
 const comments=qualifying.reduce((a,x)=>a+x.comments,0);
 if(qualifying.length<2||reach<200)return {...base,state:'WAIT_FOR_COMPARABLE_PROVIDER_METRICS',
    reason:'No two independently comparable mature company-post observations with trustworthy exposure and comments',
    cumulative_verified_exposure:reach,proposed_test:null,decision:'KEEP_CANONICAL_EDITORIAL_DEFAULT'};
 const candidate=comments===0?'TEST_RELEVANT_CUSTOMER_DISCUSSION_QUESTION':
    comments/reach<0.005?'TEST_CONCRETE_PROBLEM_CONSEQUENCE_HOOK':'TEST_CONCRETE_NEXT_STEP_CTA';
 return {...base,state:'ELIGIBLE_BOUNDED_NEXT_POST_TEST',
   cumulative_verified_exposure:reach,cumulative_comments:comments,
   source_post_ids:qualifying.map(x=>x.post_id).slice(0,5),
   proposed_test:{
      hypothesis_id:candidate,
      single_change:comments===0?'Use one useful open question tied to a concrete customer situation; do not use engagement bait':
       comments/reach<0.005?'Replace one generic opening with a concrete operational problem and consequence':
       'Make one relevant next step explicit without pressure or unverified outcome claims',
      primary_metric:'provider_observed_comments_per_eligible_exposure',
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
 if(!recommendation?.reason||!recommendation?.evidence||typeof recommendation.evidence!=='object')
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
  {name:'SCENE_HOOK',change:'Verduidelijk alleen de opening van de bestaande fictieve Mira-scène.'},
  {name:'CONSEQUENCE',change:'Verhelder uitsluitend één mogelijk zakelijk gevolg zonder claims over echte klanten.'},
  {name:'RELEVANT_QUESTION',change:'Stel een nuttige vraag bij de bestaande vrijwillige vervolgstap zonder engagementbait.'}
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
   lead_metric:channel==='blog'?'verified_qualified_cta_progression':channel==='instagram_company'?'provider_observed_comments_per_verified_exposure':'verified_clicks_and_substantive_comments',
   primary_business_metric:'attributed_verified_paid_orders',
   requires_readback:true,control:'never promote a winner from unknown denominators'};
}
