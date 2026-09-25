import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('prijzen.html','utf8');

test('pricing inline runtime owns the ready-v3 contract without rescue asset dependency',()=>{
  assert.match(html,/applyBilling\('monthly'\);selectStage\('grow'\);[\s\S]{0,500}bgPricingInteractions='ready-v3'/);
  assert.match(html,/bgPricingSelectedStage='grow'/);
  assert.match(html,/bgPricingSelectedGroup='start'/);
  assert.match(html,/bgPricingBilling='monthly'/);
  assert.match(html,/pricing-interactions-rescue-v1\.js/);
});
