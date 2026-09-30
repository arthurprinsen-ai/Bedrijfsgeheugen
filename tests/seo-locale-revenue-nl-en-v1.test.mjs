import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadRegistry } from '../tools/seo-order-engine/registry.mjs';
import { validateLocaleRevenueMap } from '../tools/seo-order-engine/locale-revenue.mjs';

test('NL/EN revenue map covers every canonical registry owner exactly once', async()=>{
  const registry=await loadRegistry();
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  assert.deepEqual(validateLocaleRevenueMap(map,registry),[]);
  assert.equal(new Set(map.pages.map(x=>x.source_route)).size,registry.pages.length);
});

test('English SEO is market-specific and not a literal NL mirror', async()=>{
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  const model=map.pages.find(x=>x.source_route==='https://www.bedrijfsgeheugen.nl/ai-modelwijzer');
  assert.equal(model.nl.primary_keyword,'ai modellen vergelijken');
  assert.equal(model.en.primary_keyword,'AI model comparison');
  assert.ok(model.en.secondary_keywords.includes('AI model selector'));
  const gov=map.pages.find(x=>x.source_route==='https://www.bedrijfsgeheugen.nl/ai-governance');
  assert.equal(gov.en.primary_keyword,'AI governance');
  assert.ok(map.measured_keyword_evidence.some(x=>x.keyword==='sovereign ai'&&x.market==='United Kingdom'&&x.search_volume===2400));
});

test('localized builder rewrites same-origin absolute commercial links into selected locale', async()=>{
  const source=await readFile('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/function resolveSameOriginAbsolute/);
  assert.match(source,/url\.origin !== SITE/);
  assert.match(source,/canonicalRoute\(locale,targetRoute\)/);
  assert.match(source,/applyLocaleRevenueMetadata\(enDoc,'en',route\)/);
  assert.match(source,/bg-keyword-cluster/);
  assert.match(source,/function localizeStructuredData/);
  assert.ok(source.includes('application/ld+json'));
});

test('sitemap generator includes English pages and hreflang alternates', async()=>{
  const source=await readFile('tools/genereer-sitemap.mjs','utf8');
  assert.match(source,/glob\('en\/\*\*\/\*\.html'\)/);
  assert.match(source,/xmlns:xhtml=/);
  assert.match(source,/hreflang=/);
  assert.match(source,/alternateLinks/);
});

test('production build runs SEO revenue enrichment and validation before locale generation', async()=>{
  const netlify=await readFile('netlify.toml','utf8');
  const prod='node tools/seo-order-engine/apply.mjs && node tools/seo-order-engine/validate.mjs && node tools/site-shell/apply-i18n.mjs && node tools/site-shell/build-localized-routes.mjs';
  assert.ok(netlify.includes(prod));
});
