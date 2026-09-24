import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing lifecycle proof uses a real mobile pointer click below sticky chrome',()=>{
  assert.match(source,/lossButton\.evaluate\(element => element\.scrollIntoView/);
  assert.match(source,/getBoundingClientRect\(\)/);
  assert.match(source,/page\.mouse\.click\(lossBox\.x \+ lossBox\.width \/ 2, lossBox\.y \+ lossBox\.height \/ 2\)/);
  assert.doesNotMatch(source,/scrollIntoViewIfNeeded\(\)/);
  assert.doesNotMatch(source,/lossButton\.click\(/);
  assert.doesNotMatch(source,/force:\s*true/);
  assert.doesNotMatch(source,/evaluate\([^)]*\.click\(/);
});
