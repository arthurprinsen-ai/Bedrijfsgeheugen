import fs from 'node:fs';
/** Fail closed when a 200/201 API request did not produce independently
 * retrieved brand-owned evidence. Missing metrics are unknown, not zero. */
const verifiedPostQualities=new Set(['OBSERVED','OBSERVED_PARTIAL_SCOPE','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED']);
const verifiedWebsiteQualities=new Set(['OBSERVED','OBSERVED_PARTIAL_SCOPE']);
const measurableKeys=['views','reach','likes','comments','reactions','saved','shares'];
const measurable=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function recentTimestamp(value,clock,hours=72){
  const at=Date.parse(String(value||''));
  return Number.isFinite(at)&&at<=clock+300000&&clock-at<=hours*3600000;
}
/** A successful read-only API call is a transport event, not observed content performance.
 * Require at least one recent tenant-scoped provider metric or consented human page
 * session with an independently fresh website source. Missing coverage is never zero. */
export function checkDailyGrowthSourceTruth(report={}, {now=new Date()}={}){
  if(report?.source_state!=='READ_ONLY_PROVIDER_OBSERVED'){
    return {ok:false,code:'CANONICAL_SOURCE_NOT_OBSERVED',source_state:String(report?.source_state||'UNKNOWN')};
  }
  const clock=now instanceof Date?now.getTime():Date.parse(String(now));
  if(!Number.isFinite(clock))return {ok:false,code:'INVALID_PROOF_CLOCK'};
  const health=report.source_quality;
  if(!health||typeof health!=='object'||!Object.keys(health).length){
    return {ok:false,code:'CANONICAL_SOURCE_COVERAGE_MISSING',source_state:report.source_state};
  }
  const posts=Array.isArray(report.social_posts)?report.social_posts:[];
  const pages=Array.isArray(report.website_pages)?report.website_pages:[];
  const postsWithMeasurements=posts.filter(p=>
    ['linkedin','instagram'].includes(p?.platform)&&
    typeof p?.post_id==='string'&&p.post_id.length>0&&
    verifiedPostQualities.has(p.provider_quality)&&
    recentTimestamp(p.observed_at,clock)&&
    measurableKeys.some(k=>measurable(p[k]))
  ).length;
  const websiteSource=health.website_interactions;
  const freshWebsite=verifiedWebsiteQualities.has(websiteSource?.quality)&&
    recentTimestamp(websiteSource?.observed_at,clock);
  const pagesWithMeasurements=freshWebsite?pages.filter(p=>
    typeof p?.path==='string'&&p.path.startsWith('/')&&
    measurable(p.human_page_sessions)&&p.human_page_sessions>0&&
    recentTimestamp(p.observed_at,clock)
  ).length:0;
  const counters={posts_with_recent_observed_metrics:postsWithMeasurements,
    pages_with_recent_consented_human_sessions:pagesWithMeasurements,
    registered_posts:posts.length,registered_pages:pages.length};
  if(postsWithMeasurements+pagesWithMeasurements===0)
    return {ok:false,code:'NO_RECENT_VERIFIED_POST_OR_WEBSITE_MEASUREMENTS',
      source_state:report.source_state,...counters,
      next_action:'REPAIR_EXISTING_PROVIDER_SOURCE_AND_RETRY_WITHIN_CANONICAL_CADENCE'};
  return {ok:true,code:'RECENT_MEASURED_CONTENT_PERFORMANCE_OBSERVED',
    source_state:report.source_state,...counters,
    partial_coverage:!postsWithMeasurements||!pagesWithMeasurements,
    outcome_attribution:'NOT_PROVEN_BY_TRAFFIC_OR_ENGAGEMENT'};
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  const file=process.argv[2];
  if(!file||file.startsWith('-')||!file.startsWith('/tmp/')||!file.endsWith('.json')){
    console.error('CANONICAL_SOURCE_PROOF_PATH_REQUIRED');process.exitCode=2;
  }else{
    try{
      const report=JSON.parse(fs.readFileSync(file,'utf8'));
      const proof=checkDailyGrowthSourceTruth(report?.daily_performance_diagnostics);
      console.log(JSON.stringify(proof));
      if(!proof.ok)process.exitCode=1;
    }catch(error){
      console.error('CANONICAL_SOURCE_PROOF_UNREADABLE');process.exitCode=2;
    }
  }
}
