import fs from 'node:fs';
/** Fail closed when a 200/201 API request did not produce independently
 * retrieved brand-owned evidence. Missing metrics are unknown, not zero. */
export function checkDailyGrowthSourceTruth(report={}){
  if(report?.source_state!=='READ_ONLY_PROVIDER_OBSERVED'){
    return {ok:false,code:'CANONICAL_SOURCE_NOT_OBSERVED',source_state:String(report?.source_state||'UNKNOWN')};
  }
  const hasPosts=Array.isArray(report.social_posts)&&report.social_posts.length>0;
  const hasSourceHealth=report.source_quality&&typeof report.source_quality==='object'&&Object.keys(report.source_quality).length>0;
  if(!hasPosts||!hasSourceHealth){
    return {ok:false,code:'CANONICAL_SOURCE_COVERAGE_MISSING',source_state:report.source_state};
  }
  return {ok:true,code:'OBSERVED_PROVIDER_SOURCE_WITH_BOUNDED_BRAND_POSTS',post_records:report.social_posts.length,
    has_consented_pages:Array.isArray(report.website_pages)&&report.website_pages.length>0};
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
