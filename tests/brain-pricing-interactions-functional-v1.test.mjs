import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=()=>readFile(new URL('../prijzen.html',import.meta.url),'utf8');
const runtime=()=>readFile(new URL('../assets/js/pricing-interactions-v4.js',import.meta.url),'utf8');

test('pricing controls use one external DOM-stable controller',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  assert.match(html,/src="\/assets\/js\/pricing-interactions-v4\.js\?v=20260923-3"/);
  assert.doesNotMatch(html,/id="bg-pricing-neno-v1-js"/);
  assert.match(js,/document\.addEventListener\('click',handleClick\)/);
  assert.match(js,/document\.addEventListener\('change',handleChange\)/);
  assert.match(js,/document\.addEventListener\('input',handleInput\)/);
  assert.match(html,/pointer-events:auto!important/);
  assert.match(html,/isolation:isolate/);
});

test('pricing direction tabs change visible plan groups after DOM replacement',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  assert.match(html,/data-bg-price-tab="start"/);
  assert.match(html,/data-bg-price-tab="run"/);
  assert.match(js,/\.bg-plan-card\[data-bg-group\]/);
  assert.match(js,/card\.hidden=!active/);
  assert.match(js,/card\.classList\.toggle\('is-active',active\)/);
  assert.match(js,/aria-hidden/);
});

test('billing toggle changes prices and checkout billing parameter',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  assert.match(html,/data-bg-billing="monthly"/);
  assert.match(html,/data-bg-billing="yearly"/);
  assert.match(html,/data-yearly="€ 14\.950"/);
  assert.match(html,/data-yearly="€ 24\.950"/);
  assert.match(js,/searchParams\.set\('billing',state\.billing\)/);
  assert.match(js,/el\.textContent=value/);
});

test('lifecycle tabs map one-to-one and hide every non-selected panel',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
    assert.match(html,new RegExp('data-bg-stage-panel="'+stage+'"'));
  }
  assert.equal((html.match(/data-bg-stage="/g)||[]).length,6);
  assert.equal((html.match(/data-bg-stage-panel="/g)||[]).length,6);
  assert.match(js,/panel\.hidden=!active/);
  assert.match(js,/panel\.classList\.toggle\('is-active',active\)/);
  assert.match(html,/\.bg-lifecycle-panel\[hidden\],\.bg-plan-card\[hidden\]\{display:none!important\}/);
});

test('mobile pricing CSS keeps controls tappable without global table-to-card conversion',async()=>{
  const html=await pricing();
  assert.match(html,/id="bg-pricing-mobile-hardening-v3"/);
  assert.doesNotMatch(html,/table,thead,tbody,tr,th,td\{display:block/);
  assert.match(html,/\.bg-stage-matrix,\.tabelwrap\{overflow-x:auto/);
  assert.match(html,/\.bg-lifecycle-tabs button\{min-height:44px/);
  assert.match(html,/\.bg-billing-toggle button\{min-height:46px\}/);
});

test('refresh and calculator controls remain functional through delegated events',async()=>{
  const js=await runtime();
  assert.match(js,/if\(event\.target&&event\.target\.id==='bgSources'\)render\(\)/);
  assert.match(js,/if\(el\.id==='bgSituation'\)setStage\(el\.value,true\)/);
  assert.match(js,/\['buy','sell','portfolio'\]/);
  assert.match(js,/setRefresh\(button\.getAttribute\('data-v'\)\)/);
});