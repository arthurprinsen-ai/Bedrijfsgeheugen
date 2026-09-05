import assert from 'node:assert/strict';
import test from 'node:test';
import { enrichRegisteredPage, inferSeoMeta } from '../tools/seo-order-engine/enrich.mjs';
import { validateSeoOrderPages } from '../tools/seo-order-engine/validate.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const registry = {
  version: 1,
  pages: [
    { route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb', secondary_keywords: [], funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [`${ORIGIN}/blog/kosten/`], schema_type: 'Service' }
  ]
};

const moneyHtml = `<!doctype html><html lang="nl"><head><title>Prijzen digitalisering mkb</title><meta name="description" content="Prijzen en aanpak"><meta name="robots" content="index, follow"><link rel="canonical" href="${ORIGIN}/prijzen"></head><body><nav aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a><span>Prijzen</span></nav><main><h1>Prijzen digitalisering mkb</h1><section data-bg-evidence><h2>Wat krijg je</h2><p>Vaste prijs en concrete scope.</p></section><a href="${ORIGIN}/frisse-blik">Plan een Frisse Blik</a></main></body></html>`;

test('geregistreerde money page krijgt schema conversion context en tracker', () => {
  const entry = registry.pages[0];
  const out = enrichRegisteredPage(moneyHtml, entry);
  assert.ok(out.includes('id="bg-seo-order-graph"'));
  assert.ok(out.includes('data-bg-conversion="frisse-blik"'));
  assert.ok(out.includes('data-bg-page-role="money"'));
  assert.ok(out.includes('data-bg-funnel-stage="decide"'));
  assert.ok(out.includes('id="bg-conversion-tracker"'));
  assert.equal(enrichRegisteredPage(out, entry), out, 'estate enrichment is idempotent');
});

test('inferSeoMeta haalt canonical title description en breadcrumbs uit zichtbare HTML', () => {
  const meta = inferSeoMeta(moneyHtml);
  assert.equal(meta.canonical, `${ORIGIN}/prijzen`);
  assert.equal(meta.title, 'Prijzen digitalisering mkb');
  assert.equal(meta.description, 'Prijzen en aanpak');
  assert.deepEqual(meta.breadcrumbs, [{ name: 'Home', url: `${ORIGIN}/` }, { name: 'Prijzen', url: `${ORIGIN}/prijzen` }]);
});

test('high-level gate accepteert verbonden money page en supportpagina', () => {
  const money = enrichRegisteredPage(moneyHtml, registry.pages[0]);
  const support = { canonical: `${ORIGIN}/blog/kosten/`, path: 'blog/kosten/index.html', html: `<html><body><main><h1>Kosten</h1><a href="${ORIGIN}/prijzen">Bekijk prijzen</a></main></body></html>` };
  const pages = [{ canonical: `${ORIGIN}/prijzen`, path: 'prijzen.html', html: money }, support];
  assert.deepEqual(validateSeoOrderPages(pages, registry, { inspectBlogs: false }), []);
});

test('canonical alias blog mag de echte money page niet overschrijven in validatie', () => {
  const entry = registry.pages[0];
  const money = enrichRegisteredPage(moneyHtml, entry);
  const alias = {
    canonical: `${ORIGIN}/prijzen`,
    path: 'blog/oude-prijzen/index.html',
    html: `<html><head><link rel="canonical" href="${ORIGIN}/prijzen"></head><body><main><h1>Oud artikel</h1></main></body></html>`
  };
  const support = { canonical: `${ORIGIN}/blog/kosten/`, path: 'blog/kosten/index.html', html: `<html><body><main><h1>Kosten</h1><a href="${ORIGIN}/prijzen">Bekijk prijzen</a></main></body></html>` };
  const pages = [
    { canonical: `${ORIGIN}/prijzen`, path: 'prijzen.html', html: money },
    support,
    alias
  ];
  const fouten = validateSeoOrderPages(pages, registry, { inspectBlogs: false }).join('\n');
  assert.doesNotMatch(fouten, /primaire CTA.*niet meetbaar/i);
  assert.doesNotMatch(fouten, /money page mist zichtbaar bewijs/i);
});
