import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');

test('mobile pricing table CSS is scoped to the comparison table wrapper',()=>{
  assert.match(html,/id="pricing-mobile-table-scope-v2"/);
  assert.doesNotMatch(html,/\n table,thead,tbody,tr,th,td\{display:block/);
  assert.match(html,/\.tabelwrap table,\.tabelwrap thead,\.tabelwrap tbody/);
});

test('pricing mobile controller owns every interactive control family',()=>{
  assert.match(html,/id="pricing-controller-v3"/);
  for(const hook of ['data-bg-stage','data-bg-price-tab','data-bg-billing','#bgRefresh button[data-v]']){
    assert.ok(html.includes(hook),hook);
  }
  assert.match(html,/document\.addEventListener\('click'/);
  assert.match(html,/document\.addEventListener\('touchend'/);
});

test('mobile route and price controls have compact responsive layouts',()=>{
  assert.match(html,/\.bg-lifecycle-tabs\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html,/\.bg-price-tabs\{display:grid!important;grid-template-columns:1fr!important/);
  assert.match(html,/\.bg-stage-matrix table\{display:table!important;width:820px!important/);
});
