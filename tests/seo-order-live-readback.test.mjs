import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLiveSeoOrderSet } from '../tools/seo-order-engine/live-readback.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const registry = {
  version: 1,
  pages: [
    { route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb', secondary_keywords: [], funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [], schema_type: 'Service' },
    { route: `${ORIGIN}/blog/`, role: 'blog-index', primary_intent: 'kennisbank', primary_keyword: 'kennisbank', secondary_keywords: [], funnel_stage: 'discover', primary_cta: { action: 'zelfscan', url: `${ORIGIN}/zelfscan` }, supporting_routes: [], schema_type: 'CollectionPage' }
  ]
};

const money = `<!doctype html><html><head><link rel="canonical" href="${ORIGIN}/prijzen"></head><body data-bg-page-role="money" data-bg-funnel-stage="decide"><main><section data-bg-evidence><h1>Prijzen</h1></section><a href="${ORIGIN}/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></main><script id="bg-seo-order-graph" type="application/ld+json">{}</script></body></html>`;
const blogIndex = `<!doctype html><html><head><link rel="canonical" href="${ORIGIN}/blog/"></head><body data-bg-page-role="blog-index" data-bg-funnel-stage="discover"><main><h1>Kennis</h1></main><script id="bg-seo-order-graph" type="application/ld+json">{}</script></body></html>`;
const article = `<!doctype html><html><head><title>Artikel</title><meta name="description" content="Artikel"><meta name="bg-zoekwoord" content="kosten digitalisering mkb"><link rel="canonical" href="${ORIGIN}/blog/test/"><meta name="bg-order-contract" content="v1"></head><body><main><article><aside data-bg-author="arthur-prinsen"><time datetime="2026-09-05">5 september 2026</time></aside><h1>Artikel</h1><section data-bg-evidence><h2>Voorbeeld</h2></section><p><a href="${ORIGIN}/prijzen">Prijzen</a><a href="${ORIGIN}/product">Product</a></p><section id="bg-order-path"><a href="${ORIGIN}/prijzen">Aanpak</a><a href="${ORIGIN}/frisse-blik" data-bg-order-cta="frisse-blik">CTA</a></section></article></main><script id="bg-seo-order-graph" type="application/ld+json">{}</script></body></html>`;

test('live readback accepteert money page blogindex en verrijkt artikel', () => {
  const pages = [
    { path: 'live-prijzen.html', canonical: `${ORIGIN}/prijzen`, html: money },
    { path: 'live-blog-index.html', canonical: `${ORIGIN}/blog/`, html: blogIndex },
    { path: 'blog/test/index.html', canonical: `${ORIGIN}/blog/test/`, html: article }
  ];
  assert.deepEqual(validateLiveSeoOrderSet(pages, registry), []);
});

test('live readback blokkeert money page zonder meetbare CTA of schema', () => {
  const broken = money.replace(' data-bg-conversion="frisse-blik"', '').replace(/<script id="bg-seo-order-graph"[\s\S]*?<\/script>/, '');
  const fouten = validateLiveSeoOrderSet([{ path: 'live-prijzen.html', canonical: `${ORIGIN}/prijzen`, html: broken }], registry).join('\n');
  assert.match(fouten, /SEO order graph ontbreekt/i);
  assert.match(fouten, /primaire CTA.*niet meetbaar/i);
});
