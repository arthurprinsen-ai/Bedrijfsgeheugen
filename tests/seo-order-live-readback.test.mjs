import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLiveSeoOrderSet } from '../tools/seo-order-engine/live-readback.mjs';
import { enrichMoneyPage } from '../tools/seo-order-engine/money-contract-v2.mjs';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';
import { enrichBlog } from '../tools/seo-order-engine/blog-contract-v2.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const registry = {
  version: 1,
  pages: [
    { route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb', secondary_keywords: [], funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [], schema_type: 'Service' },
    { route: `${ORIGIN}/blog/`, role: 'blog-index', primary_intent: 'kennisbank', primary_keyword: 'kennisbank', secondary_keywords: [], funnel_stage: 'discover', primary_cta: { action: 'zelfscan', url: `${ORIGIN}/zelfscan` }, supporting_routes: [], schema_type: 'CollectionPage' }
  ]
};

function withContext(html,{role,stage,intent,keyword,owner}){
  let out=html.replace(/<body\b([^>]*)>/i,`<body$1 data-bg-page-role="${role}" data-bg-funnel-stage="${stage}" data-bg-intent="${intent}" data-bg-keyword-cluster="${keyword}" data-bg-intent-role="primary" data-bg-intent-owner="${owner}">`);
  out=out.replace(/<\/head>/i,`<meta name="bg-intent-owner" content="${owner}"></head>`);
  return out;
}

const moneyBase = `<!doctype html><html><head><link rel="canonical" href="${ORIGIN}/prijzen"><meta name="bg-intent" content="kosten digitalisering mkb"></head><body><main><section data-bg-evidence><h1>Prijzen</h1></section><a href="${ORIGIN}/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></main><script id="bg-seo-order-graph" type="application/ld+json">{}</script></body></html>`;
let money=enrichMoneyPage(moneyBase,registry.pages[0]);
money=withContext(money,{role:'money',stage:'decide',intent:'kosten digitalisering mkb',keyword:'kosten digitalisering mkb',owner:`${ORIGIN}/prijzen`});
money=injectGrowthMeasurement(money,{canonical:`${ORIGIN}/prijzen`,page_role:'money',funnel_stage:'decide',intent:'kosten digitalisering mkb',keyword_cluster:'kosten digitalisering mkb',intent_owner:`${ORIGIN}/prijzen`});

let blogIndex = `<!doctype html><html><head><link rel="canonical" href="${ORIGIN}/blog/"><meta name="bg-intent" content="kennisbank"></head><body><main><h1>Kennis</h1></main><script id="bg-seo-order-graph" type="application/ld+json">{}</script></body></html>`;
blogIndex=withContext(blogIndex,{role:'blog-index',stage:'discover',intent:'kennisbank',keyword:'kennisbank',owner:`${ORIGIN}/blog/`});
blogIndex=injectGrowthMeasurement(blogIndex,{canonical:`${ORIGIN}/blog/`,page_role:'blog-index',funnel_stage:'discover',intent:'kennisbank',keyword_cluster:'kennisbank',intent_owner:`${ORIGIN}/blog/`});

const articleBase = `<!doctype html><html><head><title>Artikel</title><meta name="description" content="Artikel"><meta name="bg-zoekwoord" content="kosten digitalisering mkb"><link rel="canonical" href="${ORIGIN}/blog/test/"><meta property="article:published_time" content="2026-09-05"></head><body><main><article><h1>Artikel over kosten</h1><p>5 september 2026</p><h2>Voorbeeld</h2><table><tr><th>Kosten</th></tr><tr><td>Voorbeeldberekening</td></tr></table><p><a href="${ORIGIN}/prijzen">Prijzen</a><a href="${ORIGIN}/product">Product</a></p></article></main><script id="bg-seo-order-graph" type="application/ld+json">{}</script></body></html>`;
let article=enrichBlog(articleBase,'blog/test/index.html',registry);
article=injectGrowthMeasurement(article,{canonical:`${ORIGIN}/blog/test/`,page_role:'article',funnel_stage:'discover',intent:'kosten digitalisering mkb',keyword_cluster:'kosten digitalisering mkb',intent_owner:`${ORIGIN}/prijzen`});

test('live readback accepteert money page blogindex en verrijkt artikel', () => {
  const pages = [
    { path: 'live-prijzen.html', canonical: `${ORIGIN}/prijzen`, html: money },
    { path: 'live-blog-index.html', canonical: `${ORIGIN}/blog/`, html: blogIndex },
    { path: 'blog/test/index.html', canonical: `${ORIGIN}/blog/test/`, html: article }
  ];
  assert.deepEqual(validateLiveSeoOrderSet(pages, registry), []);
});

test('live readback blokkeert money page zonder meetbare CTA of schema', () => {
  const broken = money.replace(/ data-bg-conversion="frisse-blik"/g, '').replace(/<script id="bg-seo-order-graph"[\s\S]*?<\/script>/, '');
  const fouten = validateLiveSeoOrderSet([{ path: 'live-prijzen.html', canonical: `${ORIGIN}/prijzen`, html: broken }], registry).join('\n');
  assert.match(fouten, /SEO order graph ontbreekt/i);
  assert.match(fouten, /primaire CTA.*niet meetbaar/i);
});

test('live readback blokkeert verkeerde primary intent owner',()=>{
  const broken=money.replaceAll(`${ORIGIN}/prijzen`,`${ORIGIN}/product`);
  const fouten=validateLiveSeoOrderSet([{path:'live-prijzen.html',canonical:`${ORIGIN}/prijzen`,html:broken}],registry).join('\n');
  assert.match(fouten,/intent-owner/i);
});
