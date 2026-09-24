import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing lifecycle proof uses deterministic positioning and a real mobile pointer click',()=>{
  assert.match(source,/lossButton\.evaluate\([^=]+=>[^\n]*scrollIntoView/);
  assert.match(source,/getBoundingClientRect\(\)/);
  assert.match(source,/getComputedStyle\(/);
  assert.doesNotMatch(source,/scrollIntoViewIfNeeded\(\)/);

  const realPointerClick = /lossButton\.click\(/.test(source) || /page\.mouse\.click\(/.test(source);
  assert.equal(realPointerClick,true,'production proof must use Playwright pointer input');
  assert.doesNotMatch(source,/force:\s*true/);
  assert.doesNotMatch(source,/evaluate\([^)]*\.click\(/);
});
