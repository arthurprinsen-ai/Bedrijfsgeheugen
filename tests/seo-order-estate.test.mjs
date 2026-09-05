import assert from 'node:assert/strict';
import test from 'node:test';
import { enrichRegisteredPage, inferSeoMeta } from '../tools/seo-order-engine/enrich.mjs';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';
import { validateSeoOrderPages } from '../tools/seo-order-engine/validate.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const registry = {
  version: 1,
  pages: [
    { route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb', secondary_keywords: [], funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [`${ORIGIN}/blog/kosten/`], schema_type: 'Service' }
  ]
};

const moneyHtml = `<!doctype html><html lang="nl"><head><title>Prijzen digitalisering mkb</title><meta name="description" content="Prijzen en aanpak"><meta name="robots" content="index, follow"><link rel="canonical" href="${ORIGIN}/prijzen"></head><body><nav aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a><span>Prijzen</span></nav><main><h1>Prijzen digitalisering mkb</h1><section data-bg-evidence><h2>Wat krijg je</h2><p>Vaste prijs en concrete scope.</p></section><a href="${ORIGIN}/frisse-blik">Plan een Frisse Blik</a></main></body></html>`;

function measuredMoney(){
  return injectGrowthMeasurement(enrichRegisteredPage(moneyHtml,registry.pages[0]),{canonical:`${ORIGIN}/prijzen`,page_role:'money',funnel_stage:'decide',intent:'kosten digitalisering mkb',keyword_cluster:'kosten digitalisering mkb',intent_owner:`${ORIGIN}/prijzen`});
}
function measuredSupport(){
  let html=`<html><head><meta name="bg-intent-owner" content="${ORIGIN}/prijzen"></head><body data-bg-page-role="support" data-bg-funnel-stage="discover" data-bg-intent="kosten digitalisering uitleg" data-bg-keyword-cluster="kosten digitalisering uitleg" data-bg-intent-role="supporting" data-bg-intent-owner="${ORIGIN}/prijzen"><main><h1>Kosten</h1><a href="${ORIGIN}/prijzen">Bekijk prijzen</a></main></body></html>`;
  html=injectGrowthMeasurement(html,{canonical:`${ORIGIN}/blog/kosten/`,page_role:'support',funnel_stage:'discover',intent:'kosten digitalisering uitleg',keyword_cluster:'kosten digitalisering uitleg',intent_owner:`${ORIGIN}/prijzen`});
  return {canonical:`${ORIGIN}/blog/kosten/`,path:'blog/kosten/index.html',html};
}
function measuredAlias(){
  let html=`<html><head><link rel="canonical" href="${ORIGIN}/prijzen"><meta name="bg-intent-owner" content="${ORIGIN}/prijzen"></head><body data-bg-page-role="article" data-bg-funnel-stage="discover" data-bg-intent="oude prijzen uitleg" data-bg-keyword-cluster="oude prijzen uitleg" data-bg-intent-role="supporting" data-bg-intent-owner="${ORIGIN}/prijzen"><main><h1>Oud artikel</h1><a href="${ORIGIN}/prijzen">Canonical prijzen</a></main></body></html>`;
  html=injectGrowthMeasurement(html,{canonical:`${ORIGIN}/prijzen`,page_role:'article',funnel_stage:'discover',intent:'oude prijzen uitleg',keyword_cluster:'oude prijzen uitleg',intent_owner:`${ORIGIN}/prijzen`});
  return {canonical:`${ORIGIN}/prijzen`,path:'blog/oude-prijzen/index.html',html};
}

test('geregistreerde money page krijgt schema conversion context en tracker', () => {
  const entry = registry.pages[0];
  const out = enrichRegisteredPage(moneyHtml, entry);
  assert.ok(out.includes('id="bg-seo-order-graph"'));
  assert.ok(out.includes('data-bg-conversion="frisse-blik"'));
  assert.ok(out.includes('data-bg-page-role="money"'));
  assert.ok(out.includes('data-bg-funnel-stage="decide"'));
  assert.ok(out.includes('data-bg-intent-role="primary"'));
  assert.ok(out.includes(`data-bg-intent-owner="${ORIGIN}/prijzen"`));
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
  const pages = [{ canonical: `${ORIGIN}/prijzen`, path: 'prijzen.html', html: measuredMoney() }, measuredSupport()];
  assert.deepEqual(validateSeoOrderPages(pages, registry, { inspectBlogs: false }), []);
});

test('canonical alias blog blijft supporting en wordt nooit tweede primary intent owner', () => {
  const pages = [
    { canonical: `${ORIGIN}/prijzen`, path: 'prijzen.html', html: measuredMoney() },
    measuredSupport(),
    measuredAlias()
  ];
  const fouten = validateSeoOrderPages(pages, registry, { inspectBlogs: false }).join('\n');
  assert.doesNotMatch(fouten, /primary intent-role ontbreekt/i);
  assert.doesNotMatch(fouten, /primary intent-owner body marker ontbreekt/i);
  assert.doesNotMatch(fouten, /primaire CTA.*niet meetbaar/i);
});
