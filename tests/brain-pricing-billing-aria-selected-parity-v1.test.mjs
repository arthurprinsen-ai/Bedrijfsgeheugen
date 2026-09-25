import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rescue=fs.readFileSync('assets/js/pricing-interactions-rescue-v1.js','utf8');
const pricing=fs.readFileSync('prijzen.html','utf8');

test('billing controllers keep selected-state parity',()=>{
  assert.match(rescue,/setAttribute\('aria-pressed', String\(active\)\)/);
  assert.match(rescue,/setAttribute\('aria-selected', String\(active\)\)/);
  assert.match(rescue,/classList\.toggle\('is-active', active\)/);
  assert.match(rescue,/dataset\.bgPricingBilling = billing/);

  assert.match(pricing,/setAttribute\('aria-pressed',String\(active\)\)/);
  assert.match(pricing,/setAttribute\('aria-selected',String\(active\)\)/);
  assert.match(pricing,/classList\.toggle\('is-active',active\)/);
  assert.match(pricing,/dataset\.bgPricingBilling=billing/);
});
