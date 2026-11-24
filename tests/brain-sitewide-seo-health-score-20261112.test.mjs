import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditSeoPage,summarizeSeoAudit,SEO_RULES} from '../tools/site-shell/seo-health-score.mjs';
const sitemapRoutes=['/','/en/','/afas-koppeling'];
const sample={
 title:'Bedrijfsgeheugen inzichten voor organisaties en ondernemers',
 description:'Praktisch advies met samenhangende inzichten om processen, AI, data en informatie in één bedrijfsomgeving beter te benutten.',
 canonical:'https://www.bedrijfsgeheugen.nl/',htmlLang:'nl',hasViewport:true,metaRobots:'index,follow',
 xRobotsHeader:'',h1Count:1,imageCount:1,imagesMissingAlt:0,imagesMissingDimensions:0,
 stylesheetCount:3,invalidJsonLd:0,hreflangCount:0,hreflang:[]
};
test('published NL canonical with correct metadata is free of errors',()=>{
 const p=auditSeoPage({route:'/',snapshot:sample,sitemapRoutes});
 assert.equal(p.issues.filter(x=>x.severity==='ERROR').length,0);
 assert.ok(SEO_RULES.length>=15);
});
test('missing metadata, noncanonical and sitemap noindex cannot be counted as error-free',()=>{
 const p=auditSeoPage({route:'/',snapshot:{...sample,title:'',description:'',canonical:'http://www.bedrijfsgeheugen.nl/',metaRobots:'noindex',h1Count:2},sitemapRoutes});
 for(const code of ['HTML_TITLE_PRESENT','META_DESCRIPTION_PRESENT','SELF_CANONICAL','INDEXABILITY','H1_UNIQUENESS'])
  assert.ok(p.issues.some(x=>x.code===code&&x.severity==='ERROR'),code);
});
test('image alt, invalid schema and absent alternate route are flagged without inventing target',()=>{
 const p=auditSeoPage({route:'/',snapshot:{...sample,
  hreflangCount:1,hreflang:[{lang:'en',href:'https://www.bedrijfsgeheugen.nl/en/not-published'}],
  imagesMissingAlt:1,invalidJsonLd:1},sitemapRoutes});
 for(const code of ['HREFLANG_TARGET','IMAGE_ALT','STRUCTURED_DATA_JSON'])
  assert.ok(p.issues.some(x=>x.code===code),code);
});
test('health score has audited URL denominator; partial coverage yields null instead of 100',()=>{
 const good=auditSeoPage({route:'/',snapshot:sample,sitemapRoutes});
 const bad=auditSeoPage({route:'/afas-koppeling',snapshot:{...sample,canonical:'https://www.bedrijfsgeheugen.nl/wrong'},sitemapRoutes});
 const partial=summarizeSeoAudit({pages:[good,bad],sitemapRoutes,releaseSha:'abc'});
 assert.equal(partial.status,'COVERAGE_INCOMPLETE');
 assert.equal(partial.health_score_percent,null);
 const en=auditSeoPage({route:'/en/',snapshot:{...sample,canonical:'https://www.bedrijfsgeheugen.nl/en/',htmlLang:'en'},sitemapRoutes});
 const full=summarizeSeoAudit({pages:[good,bad,en],sitemapRoutes,releaseSha:'abc'});
 assert.equal(full.health_score_percent,66.67);
 assert.equal(full.pages.expected,3);
 assert.equal(full.pages.with_errors,1);
 assert.equal(full.external_data.ai_citations,'NOT_MEASURED');
});
test('original full website lane is the writer and retains one auditable artifact',()=>{
 const browser=readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');
 const lane=readFileSync('.github/workflows/lane-website.yml','utf8');
 assert.match(browser,/auditSeoPage/);
 assert.match(browser,/summarizeSeoAudit/);
 assert.match(browser,/sitewide-seo-health-report\.json/);
 assert.match(lane,/Retain original technical SEO health report/);
 assert.match(lane,/\.artifacts\/sitewide-seo-health-report\.json/);
});

test('two specialist diagnostics share one DOM snapshot but never duplicate route counts',()=>{
 const browser=readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');
 assert.equal((browser.match(/seo:\s*\{/g)||[]).length,1);
 assert.match(browser,/const seoPages = \[\];/);
 assert.match(browser,/const seoIntelligencePages = \[\];/);
 assert.match(browser,/seoPages\.push\(auditSeoPage/);
 assert.match(browser,/seoIntelligencePages\.push\(inspectRenderedSeoPage/);
 assert.match(browser,/reports:seoIntelligencePages,expectedRoutes:routes\.length/);
 assert.match(browser,/pages:seoPages,sitemapRoutes:routes/);
 assert.doesNotMatch(browser,/const seoPages = \[\];\s*const seoPages = \[\];/);
});

test('equal cardinality cannot hide missing and unexpected sitemap routes',()=>{
 const good=auditSeoPage({route:'/',snapshot:sample,sitemapRoutes});
 const missingReplaced=auditSeoPage({route:'/unexpected',snapshot:{...sample,canonical:'https://www.bedrijfsgeheugen.nl/unexpected'},sitemapRoutes});
 const en=auditSeoPage({route:'/en/',snapshot:{...sample,canonical:'https://www.bedrijfsgeheugen.nl/en/',htmlLang:'en'},sitemapRoutes});
 const report=summarizeSeoAudit({pages:[good,missingReplaced,en],sitemapRoutes});
 assert.equal(report.health_score_percent,null);
 assert.equal(report.coverage_complete,false);
 assert.deepEqual(report.pages.missing,['/afas-koppeling']);
 assert.deepEqual(report.pages.unexpected,['/unexpected']);
 assert.equal(report.pages.scanned,2);
 const duplicated=summarizeSeoAudit({pages:[good,en,en],sitemapRoutes});
 assert.equal(duplicated.pages.duplicates.observations,1);
 assert.equal(duplicated.coverage_complete,false);
});

test('hreflang needs observed self and reciprocal links, not assumed links',()=>{
 const links=[{lang:'nl',href:'https://www.bedrijfsgeheugen.nl/'},{lang:'en',href:'https://www.bedrijfsgeheugen.nl/en/'}];
 const nl=auditSeoPage({route:'/',snapshot:{...sample,hreflangCount:2,hreflang:links},sitemapRoutes});
 const enBad=auditSeoPage({route:'/en/',snapshot:{...sample,htmlLang:'en',canonical:'https://www.bedrijfsgeheugen.nl/en/',hreflangCount:1,hreflang:[links[1]]},sitemapRoutes});
 const report=summarizeSeoAudit({pages:[nl,enBad],sitemapRoutes});
 assert.ok(report.issues.some(i=>i.code==='HREFLANG_RECIPROCAL'));
 const enGood=auditSeoPage({route:'/en/',snapshot:{...sample,htmlLang:'en',canonical:'https://www.bedrijfsgeheugen.nl/en/',hreflangCount:2,hreflang:links},sitemapRoutes});
 assert.ok(!summarizeSeoAudit({pages:[nl,enGood],sitemapRoutes}).issues.some(i=>i.code==='HREFLANG_RECIPROCAL'));
 const noSelf=auditSeoPage({route:'/',snapshot:{...sample,hreflangCount:1,hreflang:[links[1]]},sitemapRoutes});
 assert.ok(noSelf.issues.some(i=>i.code==='HREFLANG_SELF'));
});

test('method coverage never implies unobserved provider or user measurements',()=>{
 const page=auditSeoPage({route:'/',snapshot:sample,sitemapRoutes});
 const report=summarizeSeoAudit({pages:[page],sitemapRoutes});
 assert.equal(report.method_coverage.length,12);
 assert.equal(report.method_coverage.find(x=>x.id==='ON_PAGE').status,'PARTIALLY_OBSERVED');
 for(const id of ['AI_SEARCH','MOBILE_PERFORMANCE','SEARCH_ANALYTICS','OFF_PAGE','EXPERIMENTATION'])
  assert.equal(report.method_coverage.find(x=>x.id===id).status,'NOT_MEASURED');
 assert.ok(report.method_coverage.every(x=>x.source.startsWith('https://')));
});
