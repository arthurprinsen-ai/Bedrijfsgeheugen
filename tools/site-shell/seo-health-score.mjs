/**
 * Reproducible on-page diagnostics for the EXISTING website browser gate.
 * No Ahrefs proprietary index or 170-rule parity is claimed.
 */
export const SEO_AUDIT_VERSION='sitewide-seo-health-v2-20261124';
export const SEO_RULES=Object.freeze(['HTML_TITLE_PRESENT','META_DESCRIPTION_PRESENT','SELF_CANONICAL','INDEXABILITY','H1_UNIQUENESS','HTML_LANG_MATCH','VIEWPORT_META','DESCRIPTION_LENGTH','TITLE_LENGTH','IMAGE_ALT','IMAGE_DIMENSIONS','STRUCTURED_DATA_JSON','HREFLANG_TARGET','HREFLANG_INVENTORY','HREFLANG_SELF','HREFLANG_RECIPROCAL','EXCESSIVE_STYLESHEETS','DUPLICATE_TITLE','DUPLICATE_DESCRIPTION']);
// Source-grounded method inventory: this is a coverage contract, not a ranking score.
export const SEO_METHODS=Object.freeze([
  {id:'DISCOVERY_CRAWL',source:'https://developers.google.com/search/docs/crawling-indexing',evidence:'Live sitemap, robots, status codes, redirects, link graph and crawl logs'},
  {id:'INDEXATION_RENDERING',source:'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',evidence:'Rendered canonical, meta and HTTP robots directives, provider-selected canonical and mobile parity'},
  {id:'ON_PAGE',source:'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',evidence:'Rendered metadata, headings and media diagnostics; intent and usefulness independently reviewed'},
  {id:'INTERNATIONAL',source:'https://developers.google.com/search/docs/specialty/international/localized-versions',evidence:'Declared locale links, reciprocal self references and actual indexable targets'},
  {id:'STRUCTURED_DATA',source:'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',evidence:'JSON syntax, semantic eligibility and truthful visible content'},
  {id:'MOBILE_PERFORMANCE',source:'https://web.dev/articles/vitals',evidence:'Real-user p75 LCP <=2.5s, INP <=200ms, CLS <=0.1, by device; lab evidence separate'},
  {id:'CONTENT_INTENT',source:'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',evidence:'Query clusters, intent owners, content decay, useful source-grounded original content'},
  {id:'OFF_PAGE',source:'https://developers.google.com/search/docs/essentials/spam-policies',evidence:'Provider-backed earned links and honest mentions, no link schemes'},
  {id:'AI_SEARCH',source:'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide',evidence:'Verified crawler permissions and actual citations/referrals; no special markup guarantee'},
  {id:'SEARCH_ANALYTICS',source:'https://support.google.com/webmasters/answer/7576553',evidence:'Current GSC page/query/device/country observations, CTR and matched periods'},
  {id:'EXPERIMENTATION',source:'https://developers.google.com/search/docs/crawling-indexing/website-testing',evidence:'Registered reversible intervention, comparison cohort and measured guardrails'},
  {id:'BING_DISCOVERY',source:'https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a',evidence:'Bing provider diagnostics and authorized IndexNow change notifications'}
].map(Object.freeze));
const ORIGIN='https://www.bedrijfsgeheugen.nl';
const norm=path=>String(path||'/').replace(/\/+$/,'')||'/';
const value=x=>String(x??'').trim();
const count=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
const issue=(route,code,severity,explanation)=>({route,code,severity,explanation});
function canonicalPath(href){
  try{const u=new URL(href);return u.origin===ORIGIN&&!u.username&&!u.password&&!u.search&&!u.hash?norm(u.pathname):null;}
  catch{return null;}
}
export function auditSeoPage({route,snapshot,sitemapRoutes}){
  if(!snapshot||!Array.isArray(sitemapRoutes))throw new TypeError('SEO_AUDIT_SOURCE_REQUIRED');
  const known=new Set(sitemapRoutes.map(norm)),current=norm(route),s=snapshot,issues=[];
  const add=(code,severity,explanation)=>issues.push(issue(current,code,severity,explanation));
  if(!known.has(current))add('SOURCE_ROUTE_OUTSIDE_SITEMAP','ERROR','Source URL not in the indexed sitemap');
  const title=value(s.title),description=value(s.description),canonical=value(s.canonical);
  if(!title)add('HTML_TITLE_PRESENT','ERROR','Missing title');
  else if(title.length<25||title.length>70)add('TITLE_LENGTH','WARNING','Title is outside 25–70 chars');
  if(!description)add('META_DESCRIPTION_PRESENT','ERROR','Missing meta description');
  else if(description.length<70||description.length>175)add('DESCRIPTION_LENGTH','WARNING','Description outside 70–175 chars');
  if(canonicalPath(canonical)!==current)add('SELF_CANONICAL','ERROR','Missing or non-self canonical');
  if(/(?:^|[\s,])(noindex|none)(?:[\s,]|$)/i.test(value(s.metaRobots)+' '+value(s.xRobotsHeader)))add('INDEXABILITY','ERROR','Sitemap route is noindex');
  const h1=count(s.h1Count);
  if(h1!==1)add('H1_UNIQUENESS','ERROR','Expected exactly one visible H1; count='+h1);
  const locale=current==='/en'||current.startsWith('/en/')?'en':'nl';
  if(value(s.htmlLang).toLowerCase()!==locale)add('HTML_LANG_MATCH','WARNING','HTML lang differs from '+locale);
  if(!s.hasViewport)add('VIEWPORT_META','WARNING','Missing responsive viewport meta');
  const imageCount=count(s.imageCount),missingAlt=count(s.imagesMissingAlt),missingSizes=count(s.imagesMissingDimensions);
  if(missingAlt)add('IMAGE_ALT','WARNING','Images lacking alt: '+missingAlt+'/'+imageCount);
  if(missingSizes)add('IMAGE_DIMENSIONS','NOTICE','Images lacking dimensions: '+missingSizes+'/'+imageCount);
  if(count(s.invalidJsonLd))add('STRUCTURED_DATA_JSON','WARNING','Unparsable JSON-LD scripts: '+count(s.invalidJsonLd));
  if(count(s.stylesheetCount)>5)add('EXCESSIVE_STYLESHEETS','NOTICE','Linked stylesheets: '+count(s.stylesheetCount));
  const links=Array.isArray(s.hreflang)?s.hreflang:[];
  if(count(s.hreflangCount)!==links.length)add('HREFLANG_INVENTORY','WARNING','Hreflang inventory truncated');
  for(const link of links){
    if(!['nl','en','x-default'].includes(value(link.lang).toLowerCase())||!known.has(canonicalPath(value(link.href))))
      add('HREFLANG_TARGET','WARNING','Alternate target absent from indexed sitemap or invalid language');
  }
  const localeLinks=links.map(link=>({lang:value(link.lang).toLowerCase(),target:canonicalPath(value(link.href))}));
  const localeInventoryComplete=Array.isArray(s.hreflang)&&Number.isInteger(s.hreflangCount)&&s.hreflangCount===links.length;
  if(localeInventoryComplete&&localeLinks.some(l=>['nl','en'].includes(l.lang))&&!localeLinks.some(l=>l.lang===locale&&l.target===current))
    add('HREFLANG_SELF','WARNING','Declared language cluster lacks self reference');
  return{route:current,title,description,canonical,locale,localeLinks,localeInventoryComplete,issues,checked_rules:SEO_RULES.length};
}
export function summarizeSeoAudit({pages,sitemapRoutes,releaseSha,source}){
  if(!Array.isArray(pages)||!Array.isArray(sitemapRoutes))throw new TypeError('SEO_REPORT_SOURCE_REQUIRED');
  const expectedRoutes=new Set(sitemapRoutes.map(norm)),known=new Set(pages.map(p=>norm(p.route))),denominator=sitemapRoutes.length,all=pages.flatMap(p=>p.issues||[]);
  const missing=[...expectedRoutes].filter(r=>!known.has(r)),unexpected=[...known].filter(r=>!expectedRoutes.has(r));
  const duplicates={sitemap:denominator-expectedRoutes.size,observations:pages.length-known.size};
  const byRoute=new Map(pages.map(p=>[norm(p.route),p]));
  let reciprocalObserved=0;
  for(const p of pages){
    if(!p.localeInventoryComplete)continue;
    for(const link of p.localeLinks||[]){
      if(!['nl','en'].includes(link.lang)||link.target===p.route)continue;
      const target=byRoute.get(link.target);
      if(!target?.localeInventoryComplete||!expectedRoutes.has(link.target))continue;
      reciprocalObserved++;
      if(target.locale!==link.lang||!target.localeLinks?.some(l=>l.lang===p.locale&&l.target===p.route))
        all.push(issue(p.route,'HREFLANG_RECIPROCAL','WARNING','Declared locale target lacks matching language or return link: '+link.target));
    }
  }
  for(const field of ['title','description']){
    const groups=new Map();
    for(const p of pages){const k=value(p[field]).toLowerCase().replace(/\s+/g,' ');if(!k)continue;
      if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
    for(const group of groups.values())if(group.length>1)for(const p of group)
      all.push(issue(p.route,field==='title'?'DUPLICATE_TITLE':'DUPLICATE_DESCRIPTION','WARNING','Identical '+field+' on '+group.length+' URLs'));
  }
  const bad=new Set(all.filter(x=>x.severity==='ERROR').map(x=>norm(x.route)));
  const counts={ERROR:0,WARNING:0,NOTICE:0};
  for(const entry of all)counts[entry.severity]=(counts[entry.severity]||0)+1;
  const complete=denominator>0&&!missing.length&&!unexpected.length&&!duplicates.sitemap&&!duplicates.observations;
  const scanned=[...known].filter(r=>expectedRoutes.has(r)).length;
  const expectedBad=[...bad].filter(r=>expectedRoutes.has(r)&&known.has(r)).length;
  const score=complete?Math.round(10000*(scanned-expectedBad)/denominator)/100:null;
  const observedIds=new Set(['DISCOVERY_CRAWL','INDEXATION_RENDERING','ON_PAGE','STRUCTURED_DATA','INTERNATIONAL']);
  const methodCoverage=SEO_METHODS.map(m=>({...m,status:observedIds.has(m.id)&&scanned>0?'PARTIALLY_OBSERVED':'NOT_MEASURED',
    detail:m.id==='INTERNATIONAL'?'Declared link inventory and '+reciprocalObserved+' observed cross-page checks; missing or unscanned targets are not assumed valid.':m.id==='DISCOVERY_CRAWL'?'Expected/observed route sets only; live HTTP, redirects, crawl logs and robots need independent evidence.':m.id==='INDEXATION_RENDERING'?'DOM canonical and robots meta only; provider-selected canonical and HTTP header coverage are not proven.':m.id==='STRUCTURED_DATA'?'JSON-LD syntax only; eligibility and visible-content truth require separate verification.':m.id==='ON_PAGE'?'Deterministic metadata and media checks only; intent and usefulness need separate review.':'Requires separate current provider or specialist evidence.'}));
  const byCode=Object.entries(all.reduce((a,i)=>{a[i.code]=(a[i.code]||0)+1;return a;},{})).map(([code,count])=>({code,count})).sort((a,b)=>b.count-a.count||a.code.localeCompare(b.code));
  return{
    version:SEO_AUDIT_VERSION,checked_at_utc:new Date().toISOString(),release_sha:releaseSha||'UNKNOWN',source,
    status:!complete?'COVERAGE_INCOMPLETE':counts.ERROR?'TECHNICAL_ERRORS_DETECTED':'NO_ERRORS_IN_IMPLEMENTED_RULES',
    health_score_percent:score,score_definition:'Error-free crawled sitemap URLs divided by all sitemap URLs',
    coverage_complete:complete,pages:{expected:denominator,scanned,error_free:scanned-expectedBad,with_errors:expectedBad,missing:missing.slice(0,80),unexpected:unexpected.slice(0,80),duplicates},method_coverage:methodCoverage,
    rule_count:SEO_RULES.length,issue_counts:counts,issue_types:byCode,issues:all.sort((a,b)=>a.route.localeCompare(b.route)||a.code.localeCompare(b.code)),
    external_data:{gsc_clicks:'NOT_MEASURED',backlinks:'NOT_MEASURED',ai_citations:'NOT_MEASURED',ai_human_referrals:'NOT_MEASURED',crux_lcp_inp:'NOT_MEASURED'},
    limits:[SEO_RULES.length+' deterministic on-page issue types only; not equivalent to 170+ Ahrefs rules','No independent provider/consumer ACK from this browser report','Missing external measurements are unknown, not zero']
  };
}
