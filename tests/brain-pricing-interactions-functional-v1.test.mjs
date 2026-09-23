import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=()=>readFile(new URL('../prijzen.html',import.meta.url),'utf8');

test('pricing interaction groups expose resilient delegated control hooks',async()=>{
  const html=await pricing();
  assert.match(html,/id="bg-pricing-interaction-guard-v2"/);
  assert.match(html,/document\.addEventListener\('click',[\s\S]*?true\)/);
  assert.match(html,/\[data-bg-price-tab\],\[data-bg-billing\],\[data-bg-stage\],#bgRefresh button\[data-v\]/);
  assert.match(html,/pointer-events:auto!important/);
  assert.match(html,/isolation:isolate/);
});

test('pricing direction tabs change visible plan groups and accessibility state',async()=>{
  const html=await pricing();
  assert.match(html,/data-bg-price-tab="start"/);
  assert.match(html,/data-bg-price-tab="run"/);
  assert.match(html,/\.bg-plan-card\[data-bg-group\]/);
  assert.match(html,/c\.hidden=!a/);
  assert.match(html,/setAttribute\('aria-hidden',String\(!a\)\)/);
  assert.match(html,/setAttribute\('aria-selected',String\(a\)\)/);
});

test('billing toggle changes prices and checkout billing parameter',async()=>{
  const html=await pricing();
  assert.match(html,/data-bg-billing="monthly"/);
  assert.match(html,/data-bg-billing="yearly"/);
  assert.match(html,/data-yearly="€ 14\.950"/);
  assert.match(html,/data-yearly="€ 24\.950"/);
  assert.match(html,/searchParams\.set\('billing',key\)/);
  assert.match(html,/el\.textContent=v/);
});

test('lifecycle and refresh controls synchronize selected state',async()=>{
  const html=await pricing();
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
    assert.match(html,new RegExp('data-bg-stage-panel="'+stage+'"'));
  }
  assert.match(html,/p\.hidden=!a/);
  assert.match(html,/b\.classList\.toggle\('active',a\)/);
  assert.match(html,/setAttribute\('aria-pressed',String\(a\)\)/);
});
