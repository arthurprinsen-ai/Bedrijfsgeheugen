import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=()=>readFile(new URL('../prijzen.html',import.meta.url),'utf8');

test('pricing controls use one canonical external controller',async()=>{
  const [html,runtime]=await Promise.all([
    pricing(),
    readFile(new URL('../assets/js/pricing-interactions-v4.js',import.meta.url),'utf8')
  ]);
  assert.match(html,/pricing-interactions-v4\.js\?v=20260924-1555/);
  assert.doesNotMatch(html,/id="bg-pricing-neno-v1-js"/);
  assert.doesNotMatch(html,/pricing-interactions-rescue-v1/);
  assert.match(runtime,/document\.addEventListener\('click'/);
  assert.match(runtime,/event\.target&&event\.target\.closest/);
  assert.match(runtime,/\[data-bg-stage\],\[data-bg-price-tab\],\[data-bg-billing\]/);
  assert.match(runtime,/dataset\.bgPricingRuntime='v5'/);
  assert.match(html,/pointer-events:auto!important/);
  assert.match(html,/isolation:isolate/);
});

test('pricing direction tabs change visible plan groups',async()=>{
  const [html,runtime]=await Promise.all([pricing(),readFile(new URL('../assets/js/pricing-interactions-v4.js',import.meta.url),'utf8')]);
  assert.match(html,/data-bg-price-tab="start"/);
  assert.match(html,/data-bg-price-tab="run"/);
  assert.match(runtime,/\.bg-plan-card\[data-bg-group\]/);
  assert.match(runtime,/card\.hidden=card\.getAttribute\('data-bg-group'\)!==group/);
  assert.match(runtime,/setAttribute\('aria-selected',String\(x\.getAttribute\('data-bg-price-tab'\)===group\)\)/);
});

test('billing toggle changes prices and checkout billing parameter',async()=>{
  const [html,runtime]=await Promise.all([pricing(),readFile(new URL('../assets/js/pricing-interactions-v4.js',import.meta.url),'utf8')]);
  assert.match(html,/data-bg-billing="monthly"/);
  assert.match(html,/data-bg-billing="yearly"/);
  assert.match(html,/data-yearly="€ 14\.950"/);
  assert.match(html,/data-yearly="€ 24\.950"/);
  assert.match(runtime,/searchParams\.set\('billing',billing\)/);
  assert.match(runtime,/var value=el\.getAttribute\(billing==='yearly'\?'data-yearly':'data-monthly'\)/);
});

test('lifecycle tabs hide every non-selected panel',async()=>{
  const [html,runtime]=await Promise.all([pricing(),readFile(new URL('../assets/js/pricing-interactions-v4.js',import.meta.url),'utf8')]);
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
    assert.match(html,new RegExp('data-bg-stage-panel="'+stage+'"'));
  }
  assert.match(runtime,/p\.hidden=p\.getAttribute\('data-bg-stage-panel'\)!==key/);
  assert.match(html,/\.bg-lifecycle-panel\[hidden\],\.bg-plan-card\[hidden\]\{display:none!important\}/);
});

test('mobile pricing CSS never converts every table on the page into cards',async()=>{
  const html=await pricing();
  assert.match(html,/id="bg-pricing-mobile-hardening-v3"/);
  assert.doesNotMatch(html,/table,thead,tbody,tr,th,td\{display:block/);
  assert.doesNotMatch(html,/\.tabelwrap\{overflow:visible\}/);
  assert.match(html,/\.bg-stage-matrix,\.tabelwrap\{overflow-x:auto/);
  assert.match(html,/\.bg-stage-matrix table,\.tabelwrap table\{display:table/);
});

test('refresh controls update active state and recalculate recommendation',async()=>{
  const runtime=await readFile(new URL('../assets/js/pricing-interactions-v4.js',import.meta.url),'utf8');
  assert.match(runtime,/refresh\.querySelectorAll\('button'\)\.forEach/);
  assert.match(runtime,/x\.classList\.toggle\('active',x===button\)/);
  assert.match(runtime,/render\(\)/);
});

test('real browser proof covers mobile pricing taps and English route',async()=>{
  const browserCheck=await readFile(new URL('../tools/site-shell/verify-pricing-i18n-production.mjs',import.meta.url),'utf8');
  assert.match(browserCheck,/\[data-bg-billing="yearly"\]/);
  assert.match(browserCheck,/\[data-bg-price-tab="run"\]/);
  assert.match(browserCheck,/\[data-bg-stage="loss"\]/);
  assert.match(browserCheck,/waitForURL[\\s\\S]*\\/en\\/prijzen/);
});

test('final pricing build integrity reinjects exactly one canonical runtime',async()=>{
  const integrity=await readFile(new URL('../tools/site-shell/pricing-build-integrity.mjs',import.meta.url),'utf8');
  assert.match(integrity,/function ensurePricingRuntime\(html\)/);
  assert.match(integrity,/pricing-interactions-v4\.js\?v=20260924-1555/);
  assert.match(integrity,/pricing runtime must have exactly one owner/);
  assert.match(integrity,/const restored = ensurePricingRuntime\(built\.replace\(current, canonical\)\)/);
});
