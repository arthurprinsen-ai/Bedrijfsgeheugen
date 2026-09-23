import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=()=>readFile(new URL('../prijzen.html',import.meta.url),'utf8');
const runtime=()=>readFile(new URL('../assets/pricing-interactions-v3.js',import.meta.url),'utf8');

test('pricing uses one cache-busted external interaction runtime',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  assert.match(html,/src="\/assets\/pricing-interactions-v3\.js\?v=20260923-1"/);
  assert.doesNotMatch(html,/bg-pricing-neno-v1-js/);
  assert.doesNotMatch(html,/bg-pricing-interaction-guard-v2/);
  assert.match(js,/document\.addEventListener\('click'/);
  assert.match(js,/\[data-bg-price-tab\],\[data-bg-billing\],\[data-bg-stage\],#bgRefresh button\[data-v\]/);
});

test('pricing direction tabs change visible plan groups and accessibility state',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  assert.match(html,/data-bg-price-tab="start"/);
  assert.match(html,/data-bg-price-tab="run"/);
  assert.match(js,/\.bg-plan-card\[data-bg-group\]/);
  assert.match(js,/card\.hidden=!active/);
  assert.match(js,/card\.classList\.toggle\('is-active',active\)/);
  assert.match(js,/setAttribute\('aria-hidden',String\(!active\)\)/);
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

test('six lifecycle tabs map one-to-one to six lifecycle panels',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
    assert.match(html,new RegExp('data-bg-stage-panel="'+stage+'"'));
  }
  assert.equal((html.match(/data-bg-stage="/g)||[]).length,6);
  assert.equal((html.match(/data-bg-stage-panel="/g)||[]).length,6);
  assert.match(js,/panel\.hidden=!active/);
  assert.match(js,/panel\.classList\.toggle\('is-active',active\)/);
  assert.match(js,/setAttribute\('aria-hidden',String\(!active\)\)/);
});

test('mobile table transformation is scoped and lifecycle matrix has dedicated responsive cards',async()=>{
  const html=await pricing();
  assert.doesNotMatch(html,/\n table,thead,tbody,tr,th,td\{display:block;width:auto\}/);
  assert.match(html,/\.tabelwrap table,\.tabelwrap thead,\.tabelwrap tbody,\.tabelwrap tr,\.tabelwrap th,\.tabelwrap td\{display:block;width:auto\}/);
  assert.match(html,/\.bg-stage-matrix table,\.bg-stage-matrix tbody,\.bg-stage-matrix tr,\.bg-stage-matrix th,\.bg-stage-matrix td\{display:block;width:100%;min-width:0\}/);
  assert.match(html,/\.bg-lifecycle-tabs\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html,/@media\(max-width:520px\)[\s\S]*?\.bg-lifecycle-tabs\{grid-template-columns:1fr\}/);
  assert.match(html,/\.bg-stage-matrix tbody td:nth-of-type\(4\)::before\{content:"Modellen"\}/);
});

test('interaction controls preserve keyboard and touch accessibility',async()=>{
  const [html,js]=await Promise.all([pricing(),runtime()]);
  assert.match(html,/touch-action:manipulation!important/);
  assert.match(html,/min-height:46px/);
  assert.match(js,/ArrowLeft/);
  assert.match(js,/ArrowRight/);
  assert.match(js,/Home/);
  assert.match(js,/End/);
  assert.match(js,/tabIndex=active\?0:-1/);
});