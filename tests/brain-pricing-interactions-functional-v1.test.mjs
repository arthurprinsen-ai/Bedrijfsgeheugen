import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=()=>readFile(new URL('../prijzen.html',import.meta.url),'utf8');

test('mobile pricing CSS never converts every table on the page into cards',async()=>{
  const html=await pricing();
  assert.match(html,/id="bg-pricing-mobile-hardening-v3"/);
  assert.doesNotMatch(html,/table,thead,tbody,tr,th,td\{display:block/);
  assert.doesNotMatch(html,/\.tabelwrap\{overflow:visible\}/);
  assert.match(html,/\.bg-stage-matrix,\.tabelwrap\{overflow-x:auto/);
  assert.match(html,/\.bg-stage-matrix table,\.tabelwrap table\{display:table/);
});

test('pricing rescue v3 survives DOM replacement and initializes immediately', async () => {
  const source = await readFile(new URL('../assets/js/pricing-interactions-rescue-v1.js', import.meta.url), 'utf8');
  assert.match(source, /__BG_PRICING_RESCUE_V2__/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /syncFromDom\(\)/);
  assert.match(source, /touchend/);
  assert.match(source, /stopImmediatePropagation/);
  assert.match(source, /dataset\.bgPricingInteractions = 'ready-v3'/);
});
