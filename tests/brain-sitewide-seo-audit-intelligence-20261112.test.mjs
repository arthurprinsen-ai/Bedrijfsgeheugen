import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectRenderedSeoPage,summarizeRenderedSeoAudit,triageExternalSeoOpportunities} from '../tools/site-shell/seo-site-audit-intelligence.mjs';
const meta={title:'AFAS koppeling voor bedrijven | Bedrijfsgeheugen',
 description:'Praktische informatie over AFAS koppelingen, integraties, gegevenscontrole en bedrijfsprocessen met duidelijke vragen en vervolgstappen.',
 canonical:'https://www.bedrijfsgeheugen.nl/afas-koppeling',robots:'index,follow',lang:'nl-NL',h1Count:1,
 images:2,imagesMissingAlt:0,jsonLdCount:1,invalidJsonLd:0,ogTitle:'AFAS koppeling',ogDescription:'Koppelingen voor bedrijven'};
test('records explicit audit coverage, real denominator and typed issue evidence',()=>{
 const r=inspectRenderedSeoPage({route:'/afas-koppeling',meta});
 assert.equal(r.issues.filter(x=>x.severity==='error').length,0);
 const result=summarizeRenderedSeoAudit({reports:[r],expectedRoutes:1,hrefsChecked:30,sourceSha:'abc123'});
 assert.equal(result.coverageComplete,true);assert.equal(result.healthScore,100);
 assert.equal(result.scanned,1);assert.equal(result.hrefsChecked,30);assert.equal(result.status,'NO_CRITICAL_FINDINGS_IN_SCOPED_RULES');
 assert.ok(result.blockedGuarantees.includes('Ahrefs full feature parity'));
});
test('sitemap noindex, mismatched canonicals, missing metadata and bad JSON-LD are visible, never silently green',()=>{
 const bad=inspectRenderedSeoPage({route:'/en/afas-koppeling',meta:{...meta,robots:'noindex',canonical:'https://www.bedrijfsgeheugen.nl/afas-koppeling',lang:'nl',h1Count:0,invalidJsonLd:1,title:'',description:''}});
 const codes=bad.issues.map(x=>x.code);
 for(const v of ['SITEMAP_NOINDEX','CANONICAL_MISMATCH','H1_COUNT','TITLE_MISSING','DESCRIPTION_MISSING','JSONLD_INVALID','HTML_LANG_MISMATCH']) assert.ok(codes.includes(v));
 const aggregate=summarizeRenderedSeoAudit({reports:[bad],expectedRoutes:2,hrefsChecked:2});
 assert.equal(aggregate.healthScore,null);assert.equal(aggregate.status,'COVERAGE_INCOMPLETE');
 assert.equal(aggregate.bySeverity.error>=6,true);
});
test('identifies duplicate commercial title and desc without inventing user traffic metrics',()=>{
 const a=inspectRenderedSeoPage({route:'/afas-koppeling',meta});
 const b=inspectRenderedSeoPage({route:'/exact-online-koppeling',meta:{...meta,canonical:'https://www.bedrijfsgeheugen.nl/exact-online-koppeling'}});
 const report=summarizeRenderedSeoAudit({reports:[a,b],expectedRoutes:2,hrefsChecked:10});
 assert.equal(report.byCategory.metadata>=4,true);
 assert.ok(report.issueSamples.some(x=>x.code==='DUPLICATE_TITLE'));
});
test('external opportunity gate rejects broad unrelated keyword ideas, stale metrics and absent canonical owners',()=>{
 const rows=[
  {keyword:'online dobbelsteen',providerId:'dataforseo',providerUpdatedAt:'2026-11-10T00:00:00Z',businessFit:0.1,searchVolume:8100},
  {keyword:'afas koppeling',providerId:'dataforseo',providerUpdatedAt:'2026-10-19T09:47:50Z',businessFit:0.97,searchVolume:170,gscImpressions:83,gscClicks:0},
  {keyword:'afas webshop koppeling',providerId:'dataforseo',providerUpdatedAt:'2026-08-19T09:47:50Z',businessFit:0.9,searchVolume:90}
 ];
 const results=triageExternalSeoOpportunities(rows,{asOf:'2026-11-12T13:00:00Z',intentOwners:{'afas koppeling':'https://www.bedrijfsgeheugen.nl/afas-koppeling','afas webshop koppeling':'https://www.bedrijfsgeheugen.nl/afas-koppeling'}});
 assert.equal(results[0].keyword,'afas koppeling');
 assert.equal(results[0].state,'READY_FOR_ORIGINAL_OWNER_REVIEW');
 assert.ok(results.find(x=>x.keyword==='online dobbelsteen').reasons.includes('IRRELEVANT_OR_NONCOMMERCIAL'));
 assert.ok(results.find(x=>x.keyword==='afas webshop koppeling').reasons.includes('PROVIDER_SOURCE_STALE'));
 assert.ok(results.every(x=>!('visitors' in x)&&!('revenue' in x)));
});
test('existing original browser sweep is wired to the audit and produces a real coverage report',()=>{
 const source=readFileSync('tools/site-shell/standalone-visibility-check.mjs','utf8');
 assert.match(source,/inspectRenderedSeoPage/);
 assert.match(source,/summarizeRenderedSeoAudit/);
 assert.match(source,/seoPages\.push/);
 assert.match(source,/SEO_SITE_AUDIT_V1/);
 assert.match(source,/expectedRoutes:routes\.length/);
});
