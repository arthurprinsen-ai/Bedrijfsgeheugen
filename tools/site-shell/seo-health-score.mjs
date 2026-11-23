/**
 * Reproducible on-page diagnostics for the EXISTING website browser gate.
 * No Ahrefs proprietary index or 170-rule parity is claimed.
 */
export const SEO_AUDIT_VERSION='sitewide-seo-health-v1-20261112';
export const SEO_RULES=Object.freeze(['HTML_TITLE_PRESENT','META_DESCRIPTION_PRESENT','SELF_CANONICAL','INDEXABILITY','H1_UNIQUENESS','HTML_LANG_MATCH','VIEWPORT_META','DESCRIPTION_LENGTH','TITLE_LENGTH','IMAGE_ALT','IMAGE_DIMENSIONS','STRUCTURED_DATA_JSON','HREFLANG_TARGET','HREFLANG_INVENTORY','EXCESSIVE_STYLESHEETS','DUPLICATE_TITLE','DUPLICATE_DESCRIPTION']);
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
  return{route:current,title,description,canonical,issues,checked_rules:SEO_RULES.length};
}
export function summarizeSeoAudit({pages,sitemapRoutes,releaseSha,source}){
  if(!Array.isArray(pages)||!Array.isArray(sitemapRoutes))throw new TypeError('SEO_REPORT_SOURCE_REQUIRED');
  const known=new Set(pages.map(p=>norm(p.route))),denominator=sitemapRoutes.length,all=pages.flatMap(p=>p.issues||[]);
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
  const complete=denominator>0&&known.size===denominator;
  const score=complete?Math.round(10000*(known.size-bad.size)/denominator)/100:null;
  const byCode=Object.entries(all.reduce((a,i)=>{a[i.code]=(a[i.code]||0)+1;return a;},{})).map(([code,count])=>({code,count})).sort((a,b)=>b.count-a.count||a.code.localeCompare(b.code));
  return{
    version:SEO_AUDIT_VERSION,checked_at_utc:new Date().toISOString(),release_sha:releaseSha||'UNKNOWN',source,
    status:!complete?'COVERAGE_INCOMPLETE':counts.ERROR?'TECHNICAL_ERRORS_DETECTED':'NO_ERRORS_IN_IMPLEMENTED_RULES',
    health_score_percent:score,score_definition:'Error-free crawled sitemap URLs divided by all sitemap URLs',
    coverage_complete:complete,pages:{expected:denominator,scanned:known.size,error_free:known.size-bad.size,with_errors:bad.size,missing:sitemapRoutes.filter(r=>!known.has(norm(r))).slice(0,80)},
    rule_count:SEO_RULES.length,issue_counts:counts,issue_types:byCode,issues:all.sort((a,b)=>a.route.localeCompare(b.route)||a.code.localeCompare(b.code)),
    external_data:{gsc_clicks:'NOT_MEASURED',backlinks:'NOT_MEASURED',ai_citations:'NOT_MEASURED',ai_human_referrals:'NOT_MEASURED',crux_lcp_inp:'NOT_MEASURED'},
    limits:['17 deterministic on-page issue types only; not equivalent to 170+ Ahrefs rules','No independent provider/consumer ACK from this browser report','Missing external measurements are unknown, not zero']
  };
}
