import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing lifecycle proof uses direct DOM query geometry and a real mobile pointer click',()=>{
  assert.doesNotMatch(source,/scrollIntoViewIfNeeded\(\)/);
  assert.doesNotMatch(source,/lossButton\.boundingBox\(\)/);
  assert.doesNotMatch(source,/lossButton\.evaluate\(/);
  assert.match(source,/page\.evaluate\(\(\) => \{/);
  assert.match(source,/document\.querySelector\('\[data-bg-stage="loss"\]'\)/);
  assert.match(source,/loss stage control is missing from production DOM/);
  assert.match(source,/getComputedStyle\(element\)/);
  assert.match(source,/getBoundingClientRect\(\)/);
  assert.match(source,/page\.mouse\.click\(lossBox\.x \+ lossBox\.width \/ 2, lossBox\.y \+ lossBox\.height \/ 2\)/);
  assert.match(source,/lossSelected !== 'true'/);
  assert.doesNotMatch(source,/force:\s*true/);
});
