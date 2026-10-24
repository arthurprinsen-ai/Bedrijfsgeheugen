/** Public market source publication date != crawler observation date.
 * Current events must not be inferred from historic/undated documents. */
export function classifyCurrentSource(row,{now=new Date(),maxSourceAgeDays=180,maxCrawlAgeDays=14}={}){
 const instant=now instanceof Date?now:new Date(now);
 if(Number.isNaN(instant.getTime()))throw new TypeError('SOURCE_FRESHNESS_CLOCK_INVALID');
 const ev=row?.evidence&&typeof row.evidence==='object'?row.evidence:{};
 if(ev.source_backed!==true)return {ok:true,reason:'NOT_CURRENT_EXTERNAL_SOURCE'};
 const type=String(ev.source_kind||row?.recommendation_type||'').toLowerCase();
 const current=/current|news|market_signal|search_intent|first_mover/.test(type);
 if(!current)return {ok:true,reason:'NOT_CLASSIFIED_AS_CURRENT_SOURCE',must_not_claim_current:true};
 let url;
 try{url=new URL(String(ev.source_url||''));}catch{return {ok:false,reason:'CURRENT_SOURCE_URL_INVALID'};}
 if(url.protocol!=='https:'||!url.hostname||url.username||url.password)
   return {ok:false,reason:'CURRENT_SOURCE_URL_INVALID'};
 const crawl=Date.parse(String(ev.source_observed_at||''));
 if(!Number.isFinite(crawl)||crawl>instant.getTime()+300000||instant.getTime()-crawl>maxCrawlAgeDays*86400000)
   return {ok:false,reason:'CURRENT_SOURCE_CRAWL_UNVERIFIED'};
 const original=Date.parse(String(ev.source_published_at||''));
 if(!Number.isFinite(original))return {ok:false,reason:'CURRENT_SOURCE_ORIGINAL_DATE_UNVERIFIED'};
 if(original>instant.getTime()+300000||original>crawl+300000)
   return {ok:false,reason:'CURRENT_SOURCE_FUTURE_PUBLICATION'};
 if(instant.getTime()-original>maxSourceAgeDays*86400000)
   return {ok:false,reason:'CURRENT_SOURCE_HISTORICAL_PUBLICATION'};
 return {ok:true,reason:'CURRENT_SOURCE_DATED_AND_CRAWLED',published_at:new Date(original).toISOString()};
}
