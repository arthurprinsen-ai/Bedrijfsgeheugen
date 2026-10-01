import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const finalizer=readFileSync('tools/site-shell/finalize-website-coherence-v1.mjs','utf8');
const css=readFileSync('assets/site-coherence-v1.css','utf8');
const portal=readFileSync('portal-v2/index.html','utf8');
const netlify=readFileSync('netlify.toml','utf8');

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
  assert.match(finalizer,/Van losse informatie naar een bedrijf dat zichzelf beter bestuurt/);
  assert.match(finalizer,/Powerhouse Intelligence/);
  assert.match(finalizer,/Powerhouse Agents/);
  assert.match(finalizer,/Powerhouse Connect/);
  assert.match(finalizer,/\/ai-modelwijzer/);
  assert.match(finalizer,/\/portaal-demo/);
});

test('product proposition is inserted after the actual product hero',()=>{
  assert.match(finalizer,/class=.*pr-hero/);
  assert.match(finalizer,/const hero=html\.match/);
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



test('product proposition lives in one hero and not a second standalone hero',()=>{
  const product=readFileSync('product.html','utf8');
  assert.equal((product.match(/data-bg-product-truth-v1/g)||[]).length,0);
  assert.match(product,/Powerhouse Intelligence/);
  assert.match(product,/Powerhouse Agents/);
  assert.match(product,/Powerhouse Connect/);
  assert.match(product,/class="pr-powerhouse"/);
});

test('Modelwijzer avoids generic governance class collisions and explains Powerhouse context',()=>{
  const html=readFileSync('ai-modelwijzer.html','utf8');
  assert.doesNotMatch(html,/class="gov"/);
  assert.match(html,/class="mwGov"/);
  assert.match(html,/mw-powerhouse-flow/);
  assert.match(html,/modelwijzer-flow-autoplay-v1/);
});

test('self-playing product and portal flows are present with reduced-motion guard',()=>{
  const product=readFileSync('product.html','utf8');
  const demo=readFileSync('portaal-demo.html','utf8');
  assert.match(product,/product-autoplay-v1/);
  assert.match(product,/prefers-reduced-motion/);
  assert.match(demo,/setInterval/);
  assert.match(demo,/prefers-reduced-motion/);
});

test('revenue-link compiler collapses repeated related-solution blocks',()=>{
  const src=readFileSync('tools/seo-order-engine/apply-revenue-links.mjs','utf8');
  assert.match(src,/function normalizeRevenueBlocks/);
  assert.match(src,/Verder in Powerhouse/);
  assert.match(src,/page\.html=normalizeRevenueBlocks/);
});
