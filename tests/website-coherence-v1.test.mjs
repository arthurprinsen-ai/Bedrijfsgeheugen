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
