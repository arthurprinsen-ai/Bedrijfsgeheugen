import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadRegistry } from '../tools/seo-order-engine/registry.mjs';
import { validateLocaleRevenueMap } from '../tools/seo-order-engine/validate-locales.mjs';
import { maakSitemap } from '../tools/genereer-sitemap.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';

test('NL/EN revenue keyword map covers every canonical SEO owner without collisions', async()=>{
  const registry=await loadRegistry();
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  assert.deepEqual(validateLocaleRevenueMap(map,registry),[]);
  assert.equal(map.pages.length,registry.pages.length);
});

test('AI Modelwijzer owns commercial model-comparison intent in both languages', async()=>{
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  const page=map.pages.find(x=>x.source_route===ORIGIN+'/ai-modelwijzer');
  assert.ok(page);
  assert.equal(page.nl.primary_keyword,'ai modellen vergelijken');
  assert.equal(page.en.primary_keyword,'AI model comparison');
  assert.ok(page.en.secondary_keywords.includes('AI model selector'));
  assert.equal(page.en.route,ORIGIN+'/en/ai-modelwijzer');
  assert.equal(page.role,'support');
  assert.equal(page.revenue_priority,'support');
  assert.equal(page.conversion_destination,ORIGIN+'/frisse-blik');
});

test('measured keyword evidence contains revenue-signalling NL and EN demand', async()=>{
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  const byKey=(keyword,market)=>map.measured_keyword_evidence.find(x=>x.keyword===keyword&&x.market===market);
  assert.ok(byKey('bedrijfsprocessen automatiseren','Netherlands')?.search_volume>=480);
  assert.ok(byKey('ai governance','Netherlands')?.cpc_eur>=15);
  assert.ok(byKey('ai model comparison','United Kingdom')?.search_volume>=390);
  assert.ok(byKey('sovereign ai','United Kingdom')?.search_volume>=2400);
});

test('localized route builder applies market-specific metadata after translation and owns localized intent markers', async()=>{
  const source=await readFile('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/SEO_LOCALE_REVENUE_MAP_FILE/);
  assert.match(source,/applyLocaleSeoMetadata\(doc,locale,route,localizedUrl\)/);
  assert.match(source,/data-bg-locale-seo/);
  assert.match(source,/bg-keyword-cluster/);
  assert.match(source,/bg-intent-owner/);
});

test('sitemap emits reciprocal hreflang for NL and EN canonicals',()=>{
  const xml=maakSitemap([ORIGIN+'/ai-modelwijzer',ORIGIN+'/en/ai-modelwijzer']);
  assert.match(xml,/xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.match(xml,/hreflang="nl" href="https:\/\/www\.bedrijfsgeheugen\.nl\/ai-modelwijzer"/);
  assert.match(xml,/hreflang="en" href="https:\/\/www\.bedrijfsgeheugen\.nl\/en\/ai-modelwijzer"/);
  assert.match(xml,/hreflang="x-default"/);
});

test('production build projects revenue links before final sitemap and validates locales before release evidence',async()=>{
  const netlify=await readFile('netlify.toml','utf8');
  const link=netlify.indexOf('node tools/seo-order-engine/apply-revenue-links.mjs');
  const sitemap=netlify.indexOf('node tools/genereer-sitemap.mjs');
  const validate=netlify.indexOf('node tools/seo-order-engine/validate-locales.mjs');
  const evidence=netlify.indexOf('node tools/bouw-release-evidence.mjs');
  assert.ok(link>=0&&sitemap>link&&validate>sitemap&&evidence>validate);
});

test('revenue linker projects localized inbound, cluster and conversion links',async()=>{
  const source=await readFile('tools/seo-order-engine/apply-revenue-links.mjs','utf8');
  assert.match(source,/data-bg-revenue-link="cluster"/);
  assert.match(source,/data-bg-revenue-link="conversion"/);
  assert.match(source,/data-bg-money-route/);
  assert.match(source,/for\(const locale of \['nl','en'\]\)/);
});


test('HTML entity serialization does not create false locale SEO mismatches',async()=>{
  const source=await readFile('tools/seo-order-engine/validate-locales.mjs','utf8');
  assert.match(source,/function decodeHtml/);
  assert.match(source,/replace\(\/&amp;\/g,'&'\)/);
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  assert.ok(map.pages.some(x=>String(x.en?.title||'').includes('&')));
});
