import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('SEO PR gating is changed-page scoped while full audit remains default', async()=>{
  const py=await readFile('.github/scripts/seocontrole.py','utf8');
  const wf=await readFile('.github/workflows/paginacontrole.yml','utf8');
  assert.match(py,/SEO_SCOPE_URLS/);
  assert.match(py,/gate_bevindingen/);
  assert.match(py,/if not scope_urls/);
  assert.doesNotMatch(py,/de menubalk wijkt af van \.github\/canoniek\/kop\.html/);
  assert.doesNotMatch(py,/de voettekst wijkt af van \.github\/canoniek\/voet\.html/);
  assert.match(wf,/urls<<EOF/);
  assert.match(wf,/SEO_SCOPE_URLS: \$\{\{ steps\.seo_scope\.outputs\.urls \}\}/);
  assert.match(wf,/working-directory: \$\{\{ runner\.temp \}\}\/site/);
});

test('known #1448 content findings remain fixed', async()=>{
  const prijzen=await readFile('prijzen.html','utf8');
  const product=await readFile('product.html','utf8');
  const data=await readFile('data-soevereiniteit.html','utf8');
  assert.doesNotMatch(prijzen,/\bimplementatie\b/i);
  assert.doesNotMatch(product,/\boptimaliseren\b|\boptimalisatie\b/i);
  const title=(data.match(/<title>([^<]*)<\/title>/i)||[])[1]||'';
  assert.ok(title.length<=65);
  const desc=(prijzen.match(/<meta name="description" content="([^"]*)"/i)||[])[1]||'';
  assert.ok(desc.length>=110 && desc.length<=165);
});
