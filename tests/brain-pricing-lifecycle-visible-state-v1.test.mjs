import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('assets/js/pricing-interactions-rescue-v1.js','utf8');

test('pricing lifecycle selected panel gets explicit browser-visible state',()=>{
  assert.match(source,/removeAttribute\('hidden'\)/);
  assert.match(source,/style\.setProperty\('display','block','important'\)/);
  assert.match(source,/setAttribute\('hidden',''\)/);
  assert.match(source,/style\.setProperty\('display','none','important'\)/);
  assert.match(source,/bg-pricing-rescue-state-style/);
  assert.match(source,/bgPricingSelectedStage = key/);
});
