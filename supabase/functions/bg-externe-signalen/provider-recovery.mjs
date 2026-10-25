/**
 * One bounded retry plan for the existing DataForSEO market-source adapter.
 * Codes are from DataForSEO response status_code, not HTTP success alone.
 * Never retry account/billing/input errors or invent SERP results.
 */
export function shortenMarketKeyword(keyword){
  const words=String(keyword||'').trim().split(/\s+/).filter(Boolean);
  if(words.length<7)return null;
  const prefix=words.slice(0,5);
  const market=words.findLast(w=>/^(Nederland|Netherlands|Belgi[eë]|Belgium)$/i.test(w));
  if(market&&!prefix.some(w=>w.toLowerCase()===market.toLowerCase()))prefix.push(market);
  const reduced=prefix.join(' ');
  return reduced!==words.join(' ')?reduced:null;
}
export function dataforseoRecoveryPlan({httpStatus=200,statusCode=0,keyword=''}={}){
  const http=Number(httpStatus),code=Number(statusCode);
  if([401,402,403].includes(http)||[40000,40100,40104,40200,40505,40506].includes(code))
    return {retry:false,reason:'PERMANENT_PROVIDER_AUTH_BILLING_OR_INPUT',keyword:null};
  if([40101,40103].includes(code)){
    const shortened=shortenMarketKeyword(keyword);
    return shortened?
      {retry:true,reason:'SEARCH_ENGINE_RETRY_SHORT_QUERY',keyword:shortened}:
      {retry:true,reason:'SEARCH_ENGINE_RETRY_SAME_QUERY',keyword:String(keyword)};
  }
  if([429,500,502,503,504].includes(http)||
    [50000,50001,50301,50302,50303,50304,50401,50402].includes(code))
    return {retry:true,reason:'TRANSIENT_PROVIDER_RETRY_SAME_QUERY',keyword:String(keyword)};
  return {retry:false,reason:'NON_RETRYABLE_PROVIDER_RESPONSE',keyword:null};
}
export function isRecentFailedSourceTopic(events,topic){
  if(!Array.isArray(events)||!topic)return false;
  const latest=events.find(row=>Array.isArray(row?.evidence?.selected_topics)&&
    row.evidence.selected_topics.includes(topic));
  if(!latest)return false;
  const accepted=Array.isArray(latest.evidence.source_routes)?latest.evidence.source_routes:[];
  return !accepted.some(route=>route?.topic===topic)&&Number(latest.evidence.failed_topics)>0;
}
