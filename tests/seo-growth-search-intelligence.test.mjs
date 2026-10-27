import test from 'node:test';
import assert from 'node:assert/strict';
import { mapQueryToRegistry, normalizeSearchRows } from '../tools/seo-growth/search-intelligence.mjs';

const registry={pages:[{route:'https://www.bedrijfsgeheugen.nl/afas-koppeling',role:'money',primary_intent:'afas koppeling',primary_keyword:'afas koppeling',secondary_keywords:['afas api koppeling','afas integratie']},{route:'https://www.bedrijfsgeheugen.nl/',role:'pillar',primary_intent:'digitalisering mkb',primary_keyword:'digitalisering mkb',secondary_keywords:['mkb digitaliseren']}]};
test('query maps to dominant commercial keyword cluster',()=>{const m=mapQueryToRegistry('AFAS API koppeling maken',registry);assert.equal(m.entry.route,'https://www.bedrijfsgeheugen.nl/afas-koppeling');assert.ok(m.confidence>0);});
test('unknown query remains discovery candidate and never becomes a page',()=>{const m=mapQueryToRegistry('quantum bananen fabriek',registry);assert.equal(m.entry,null);assert.equal(m.discovery_candidate,'quantum bananen fabriek');});
test('search rows join canonical and intent model',()=>{const [o]=normalizeSearchRows([{query:'afas koppeling',impressions:300,clicks:21,ctr:.07,position:3.4,period:'2026-09'}],'google-search-console',registry);assert.equal(o.canonical,'https://www.bedrijfsgeheugen.nl/afas-koppeling');assert.equal(o.intent_id,'afas koppeling');assert.equal(o.metrics.impressions,300);});


const localeRevenueMap={pages:[{
  source_route:'https://www.bedrijfsgeheugen.nl/ai-modelwijzer',
  en:{route:'https://www.bedrijfsgeheugen.nl/en/ai-modelwijzer',primary_keyword:'AI model comparison',secondary_keywords:['AI model selector','best AI model for business']}
}]};
const bilingualRegistry={pages:[{
  route:'https://www.bedrijfsgeheugen.nl/ai-modelwijzer',
  role:'money',
  primary_intent:'ai model kiezen voor bedrijf',
  primary_keyword:'ai modellen vergelijken',
  secondary_keywords:['ai model vergelijken']
}]};

test('English query maps to the Dutch canonical owner through locale revenue keywords',()=>{
  const m=mapQueryToRegistry('best AI model for business',bilingualRegistry,localeRevenueMap);
  assert.equal(m.entry.route,'https://www.bedrijfsgeheugen.nl/ai-modelwijzer');
  assert.ok(m.confidence>0);
});

test('English search rows preserve English canonical and keyword cluster for attribution',()=>{
  const [o]=normalizeSearchRows([{query:'AI model comparison',locale:'en',impressions:140,clicks:12,position:5,period:'2026-09'}],'google-search-console',bilingualRegistry,localeRevenueMap);
  assert.equal(o.canonical,'https://www.bedrijfsgeheugen.nl/en/ai-modelwijzer');
  assert.equal(o.keyword_cluster,'AI model comparison');
});
