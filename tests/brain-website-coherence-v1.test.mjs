import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const finalizer=readFileSync('tools/site-shell/finalize-website-coherence-v1.mjs','utf8');
const css=readFileSync('assets/site-coherence-v1.css','utf8');
const portal=readFileSync('portal-v2/index.html','utf8');
const netlify=readFileSync('netlify.toml','utf8');

// Functional contracts beat legacy CSS-class names: the product may evolve its
// hero markup as long as one primary hero and the contextual Powerhouse model remain.

test('contact navigation is repaired centrally',()=>{
  assert.match(finalizer,/fixContactLinks/);
  assert.match(finalizer,/\/#contact/);
  assert.match(finalizer,/\/contact/);
});

test('pricing, ai ecosystem and integrations have route-scoped layout guards',()=>{
  assert.match(css,/data-bg-route="\/prijzen"/);
  assert.match(css,/data-bg-route="\/ai-ecosysteem"/);
  assert.match(css,/data-bg-route="\/systemen-koppelen"/);
});

test('product page gets canonical Powerhouse website portal parity section',()=>{
  assert.match(finalizer,/data-bg-product-truth-v1/);
  assert.match(finalizer,/Powerhouse Intelligence/);
  assert.match(finalizer,/Powerhouse Agents/);
  assert.match(finalizer,/Powerhouse Connect/);
});

test('portal loads the parity stylesheet',()=>{
  assert.match(portal,/site-parity-v1\.css/);
});

test('final coherence pass runs in production and deploy preview builds',()=>{
  const uses=netlify.match(/finalize-website-coherence-v1\.mjs/g)||[];
  assert.ok(uses.length>=2);
});

test('pricing composer preserves canonical visual-regression hero hooks',()=>{
  const pricing=readFileSync('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
  assert.match(pricing,/class="hero held" data-bg-component="hero"/);
  assert.match(pricing,/class="bgkruim"/);
  assert.match(pricing,/class="choice pil"/);
});


test('product proposition is contextual rather than internal implementation copy',()=>{
  assert.doesNotMatch(finalizer,/Website en portaal vertellen voortaan exact hetzelfde verhaal/);
  assert.match(finalizer,/Eén platform\. Drie lagen die samenwerken\./);
  assert.match(finalizer,/Powerhouse Intelligence/);
  assert.match(finalizer,/Powerhouse Agents/);
  assert.match(finalizer,/Powerhouse Connect/);
  assert.match(finalizer,/\/ai-modelwijzer/);
  assert.match(finalizer,/\/portaal-demo/);
});

test('product proposition is inserted after the actual first product section',()=>{
  assert.match(finalizer,/const mainStart=html\.search/);
  assert.match(finalizer,/const firstSection=afterMain\.match/);
  assert.match(finalizer,/firstSection\[0\]\.length/);
});

test('package advisor and professional portal demo are real routes',()=>{
  const pricing=readFileSync('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
  const advisor=readFileSync('pakketadvies.html','utf8');
  const demo=readFileSync('portaal-demo.html','utf8');
  assert.match(pricing,/\/pakketadvies\?/);
  assert.match(pricing,/id="pkgGo"/);
  assert.match(advisor,/PAKKETADVIES/);
  assert.match(advisor,/Powerhouse Intelligence|Intelligence/);
  assert.match(demo,/INTERACTIEVE PORTAAL-DEMO/);
  assert.match(demo,/Powerhouse Agents/);
  assert.match(demo,/Powerhouse Connect/);
});

test('pricing CTAs and portal visuals are layout-contained',()=>{
  const pricing=readFileSync('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
  const portalCss=readFileSync('portal-v2/site-parity-v1.css','utf8');
  assert.match(pricing,/display:flex;flex-direction:column;height:100%/);
  assert.match(pricing,/min-height:50px/);
  assert.match(portalCss,/max-height:430px/);
  assert.match(portalCss,/overflow:hidden/);
});



test('product page keeps one primary hero and embeds Powerhouse model in context',()=>{
  assert.doesNotMatch(finalizer,/POWERHOUSE · HET ACTUELE PRODUCT/);
  assert.ok(!finalizer.includes('<h2>Website en portaal spreken nu dezelfde taal.</h2>'));
  assert.match(finalizer,/ZO WERKT POWERHOUSE/);
  assert.match(finalizer,/Eén platform\. Drie lagen die samenwerken\./);
  assert.match(finalizer,/legacySection/);
  assert.match(finalizer,/firstSection/);
});

test('product hero has an explicit visibility fail-safe',()=>{
  assert.ok(css.includes('body[data-bg-route="/product"] .pr-hero'));
  assert.ok(css.includes('body[data-bg-route="/en/product"] .pr-hero'));
  assert.ok(css.includes('visibility:visible!important'));
  assert.ok(css.includes('opacity:1!important'));
});


test('key route metadata survives terminal build',()=>{
  assert.match(finalizer,/\/pakketadvies/);
  assert.match(finalizer,/Welk Powerhouse-pakket past bij mij\?/);
  assert.match(finalizer,/Interactieve Powerhouse portaal-demo/);
  assert.match(finalizer,/Kosten digitalisering mkb \| Powerhouse prijzen/);
  assert.match(finalizer,/ensureRouteMetadata/);
  assert.match(finalizer,/og:title/);
  assert.match(finalizer,/twitter:title/);
});
