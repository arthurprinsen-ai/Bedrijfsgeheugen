/**
 * SEO site-intelligence for the EXISTING single-owner browser/site audit.
 * Pure functions: no network, provider writes, schedulers or agent claims.
 * A passing route sweep is not a claim of zero SEO warnings or higher traffic.
 */
const SITE='https://www.bedrijfsgeheugen.nl';
const text=v=>String(v??'').trim();
const cleanPath=value=>String(value||'/').replace(/\/+$/,'')||'/';
const asNumber=v=>Number.isFinite(Number(v))?Number(v):0;
const issue=(category,code,severity,action)=>({category,code,severity,action});
export const TECHNICAL_AUDIT_CATEGORIES=Object.freeze([
  'crawlability','indexability','sitemaps','canonicals','localization',
  'content','metadata','structured_data','images','internal_links',
  'performance','mobile','accessibility','security','conversion',
  'external_links','search_demand','ai_visibility','backlinks'
]);

export function inspectRenderedSeoPage({route,meta,origin=SITE}){
  if(!meta||typeof meta!=='object'||!route) throw new TypeError('SEO_PAGE_SOURCE_REQUIRED');
  const issues=[];
  const add=(category,code,severity,action)=>issues.push(issue(category,code,severity,action));
  const title=text(meta.title),description=text(meta.description);
  if(!title) add('metadata','TITLE_MISSING','error','Write a unique descriptive title aligned with page intent');
  else if(title.length<25||title.length>65) add('metadata','TITLE_LENGTH','warning','Review title relevance and visible SERP truncation');
  if(!description) add('metadata','DESCRIPTION_MISSING','error','Add unique accurate meta description');
  else if(description.length<55||description.length>165) add('metadata','DESCRIPTION_LENGTH','warning','Improve SERP snippet for search intent');
  if(asNumber(meta.h1Count)!==1) add('content','H1_COUNT','error','Use exactly one meaningful visible H1');
  let url=null;
  try{url=new URL(text(meta.canonical))}catch{}
  if(!url||url.origin!==origin||cleanPath(url.pathname)!==cleanPath(route)||url.search||url.hash)
    add('canonicals','CANONICAL_MISMATCH','error','Use the exact self-canonical on the public sitemap route');
  if(/(?:^|[,;\s])noindex(?:[,;\s]|$)/i.test(text(meta.robots??meta.metaRobots)))
    add('indexability','SITEMAP_NOINDEX','error','Remove from sitemap or correct noindex authority');
  const expectedLang=route.startsWith('/en/')||route==='/en'?'en':'nl';
  if(!text(meta.lang??meta.htmlLang).toLowerCase().startsWith(expectedLang))
    add('localization','HTML_LANG_MISMATCH','warning','Review locale and translated route');
  if(asNumber(meta.imagesMissingAlt)>0)
    add('images','IMAGES_MISSING_ALT','warning','Add suitable ALT descriptions or decorative empty ALT');
  if(asNumber(meta.invalidJsonLd)>0)
    add('structured_data','JSONLD_INVALID','error','Repair invalid JSON-LD and match visible facts');
  if(!text(meta.ogTitle)||!text(meta.ogDescription))
    add('metadata','SOCIAL_META_INCOMPLETE','notice','Add accurate social sharing metadata');
  if(asNumber(meta.uncompressedImageCount)>0)
    add('images','OVERSIZED_IMAGE_DIMENSIONS','notice','Inspect images with exceptionally large intrinsic dimensions');
  return {route,issues,metadata:{title,description},metrics:{
    images:asNumber(meta.images??meta.imageCount),imagesMissingAlt:asNumber(meta.imagesMissingAlt),
    structuredData:asNumber(meta.jsonLdCount),canonical:text(meta.canonical),lang:text(meta.lang??meta.htmlLang)
  }};
}

export function summarizeRenderedSeoAudit({reports,expectedRoutes,hrefsChecked,sourceSha}){
  if(!Array.isArray(reports)||!Number.isInteger(expectedRoutes)||expectedRoutes<1)
    throw new TypeError('SEO_AUDIT_COVERAGE_SOURCE_REQUIRED');
  const byRoute=new Set(reports.map(r=>r.route));
  const issues=reports.flatMap(r=>r.issues.map(x=>({...x,route:r.route})));
  const seen=new Map();
  for(const field of ['title','description']){
    const groups=new Map();
    for(const r of reports){
      const key=text(r.metadata?.[field]).toLocaleLowerCase('nl');
      if(!key)continue;
      const routes=groups.get(key)||[];
      routes.push(r.route);
      groups.set(key,routes);
    }
    for(const group of groups.values()){
      if(group.length<2)continue;
      const code=field==='title'?'DUPLICATE_TITLE':'DUPLICATE_DESCRIPTION';
      for(const route of group)issues.push({...issue('metadata',code,'warning','Review distinct commercial search intent per canonical owner'),route});
    }
  }
  const byCategory={};const bySeverity={error:0,warning:0,notice:0};
  for(const x of issues){byCategory[x.category]=(byCategory[x.category]||0)+1;bySeverity[x.severity]++;}
  const criticalPages=new Set(issues.filter(x=>x.severity==='error').map(x=>x.route));
  const complete=byRoute.size===expectedRoutes&&reports.length===expectedRoutes;
  const healthScore=complete?Number(((expectedRoutes-criticalPages.size)*100/expectedRoutes).toFixed(2)):null;
  return {
    contract:'SEO_SITE_INTELLIGENCE_V1',sourceSha:sourceSha||'UNVERIFIED',
    discovered:expectedRoutes,scanned:reports.length,uniqueRoutes:byRoute.size,
    coverageComplete:complete,hrefsChecked:asNumber(hrefsChecked),
    auditCategories:TECHNICAL_AUDIT_CATEGORIES,
    categoryCoverage:{measured:['canonicals','indexability','content','metadata','structured_data','images','localization'],otherCategories:'ORIGINAL_ADDITIONAL_AUDITS_OR_NOT_MEASURED'},
    healthScore,healthDenominator:complete?expectedRoutes:null,
    status:!complete?'COVERAGE_INCOMPLETE':bySeverity.error?'ISSUES_DETECTED':'NO_CRITICAL_FINDINGS_IN_SCOPED_RULES',
    issueCount:issues.length,bySeverity,byCategory,
    issueSamples:issues.slice(0,20),
    blockedGuarantees:['Ahrefs full feature parity','external backlink authority','organic/AI visitor increases','consumer processed ACK without original receipts']
  };
}

/** Paid provider data cannot produce a publish action without an explicit owner. */
export function triageExternalSeoOpportunities(rows,{intentOwners={},asOf,excludeUnknownOwner=true}={}){
  if(!Array.isArray(rows))throw new TypeError('SOURCE_ROWS_REQUIRED');
  const now=Date.parse(asOf||new Date().toISOString());
  if(!Number.isFinite(now))throw new TypeError('AS_OF_INVALID');
  const decisions=[];
  for(const item of rows){
    const keyword=text(item.keyword).toLowerCase(),owner=intentOwners[keyword]||null;
    const updatedAt=Date.parse(item.providerUpdatedAt||'');
    const ageDays=Number.isFinite(updatedAt)?Math.floor((now-updatedAt)/86400000):null;
    const volume=asNumber(item.searchVolume);
    const fit=Number(item.businessFit);
    const reasons=[];
    if(!item.providerId)reasons.push('PROVIDER_PROOF_MISSING');
    if(!Number.isFinite(fit)||fit<0.75)reasons.push('BUSINESS_FIT_NOT_VERIFIED');
    if(!owner&&excludeUnknownOwner)reasons.push('ORIGINAL_INTENT_OWNER_MISSING');
    if(ageDays===null||ageDays<0||ageDays>30)reasons.push('PROVIDER_SOURCE_STALE');
    if(volume<1)reasons.push('SEARCH_DEMAND_NOT_PROVEN');
    if(/(?:dobbelsteen|fascisme|betekenis|horoscoop|vacature|weerbericht)/i.test(keyword))
      reasons.push('IRRELEVANT_OR_NONCOMMERCIAL');
    const gscImpressions=asNumber(item.gscImpressions),gscClicks=asNumber(item.gscClicks);
    const score=reasons.length?null:Math.round(100*(Math.log10(1+volume)/4)*fit*
      (1+Math.min(1,gscImpressions/50))*(1-gscClicks/Math.max(1,gscImpressions))*100)/100;
    decisions.push({keyword,canonicalOwner:owner,providerId:item.providerId,
      sourceUpdatedAt:item.providerUpdatedAt||null,providerAgeDays:ageDays,
      searchVolumeEstimate:volume,aiSearchVolumeEstimate:item.aiSearchVolume??null,
      gscImpressions,gscClicks,score,reasons,
      state:reasons.length?'NEEDS_SOURCE_OR_OWNER_RECOVERY':'READY_FOR_ORIGINAL_OWNER_REVIEW'});
  }
  return decisions.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.keyword.localeCompare(b.keyword));
}
