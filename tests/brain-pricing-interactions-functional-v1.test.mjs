import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=()=>readFile(new URL('../prijzen.html',import.meta.url),'utf8');

test('pricing controls have one canonical controller without duplicate guard',async()=>{
  const html=await pricing();
  assert.match(html,/id="bg-pricing-neno-v1-js"/);
  assert.doesNotMatch(html,/id="bg-pricing-interaction-guard-v2"/);
  assert.match(html,/stageButtons\.forEach[\s\S]*?addEventListener\('click'/);
  assert.match(html,/tabs\.forEach[\s\S]*?addEventListener\('click'/);
  assert.match(html,/billingButtons\.forEach[\s\S]*?addEventListener\('click'/);
  assert.match(html,/pointer-events:auto!important/);
  assert.match(html,/isolation:isolate/);
});

test('pricing direction tabs change visible plan groups',async()=>{
  const html=await pricing();
  assert.match(html,/data-bg-price-tab="start"/);
  assert.match(html,/data-bg-price-tab="run"/);
  assert.match(html,/\.bg-plan-card\[data-bg-group\]/);
  assert.match(html,/card\.hidden=card\.getAttribute\('data-bg-group'\)!==group/);
  assert.match(html,/setAttribute\('aria-selected',String\(x\.getAttribute\('data-bg-price-tab'\)===group\)\)/);
});

test('billing toggle changes prices and checkout billing parameter',async()=>{
  const html=await pricing();
  assert.match(html,/data-bg-billing="monthly"/);
  assert.match(html,/data-bg-billing="yearly"/);
  assert.match(html,/data-yearly="€ 14\.950"/);
  assert.match(html,/data-yearly="€ 24\.950"/);
  assert.match(html,/searchParams\.set\('billing',billing\)/);
  assert.match(html,/el\.textContent=el\.getAttribute\(billing==='yearly'\?'data-yearly':'data-monthly'\)/);
});

test('lifecycle tabs hide every non-selected panel',async()=>{
  const html=await pricing();
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
    assert.match(html,new RegExp('data-bg-stage-panel="'+stage+'"'));
  }
  assert.match(html,/p\.hidden=p\.getAttribute\('data-bg-stage-panel'\)!==key/);
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
  const html=await pricing();
  assert.match(html,/refresh\.querySelectorAll\('button'\)\.forEach/);
  assert.match(html,/x\.classList\.toggle\('active',x===b\)/);
  assert.match(html,/render\(\)/);
});

test('mobile taps have an external delegated rescue controller',async()=>{
  const [html,runtime]=await Promise.all([
    pricing(),
    readFile(new URL('../assets/js/pricing-interactions-rescue-v1.js',import.meta.url),'utf8')
  ]);
  assert.match(html,/pricing-interactions-rescue-v1\.js\?v=20260923-1220/);
  assert.match(runtime,/document\.addEventListener\('click'/);
  assert.match(runtime,/document\.addEventListener\('pointerup'/);
  assert.match(runtime,/event\.pointerType !== 'touch'/);
  assert.match(runtime,/\[data-bg-stage\]/);
  assert.match(runtime,/\[data-bg-price-tab\]/);
  assert.match(runtime,/\[data-bg-billing\]/);
  assert.match(runtime,/panel\.hidden = !active/);
  assert.match(runtime,/searchParams\.set\('billing', billing\)/);
});


test('pricing rescue v2 survives DOM replacement and initializes immediately', async () => {
  const source = await readFile(new URL('../assets/js/pricing-interactions-rescue-v1.js', import.meta.url), 'utf8');
  assert.match(source, /__BG_PRICING_RESCUE_V2__/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /syncFromDom\(\)/);
  assert.match(source, /touchend/);
  assert.match(source, /stopImmediatePropagation/);
  assert.match(source, /data\.bgPricingInteractions = 'ready-v2'/);
});
