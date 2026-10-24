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
   &&['OBSERVED','PROVIDER_OBSERVED'].includes(s.data_quality)
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
   const exposure=number(metrics.reach)??number(metrics.views);
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
