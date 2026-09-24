import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('pricing production lifecycle proof bypasses locator resolution but preserves real pointer semantics', async()=>{
  const source=await readFile('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/document\.querySelector\('\[data-bg-stage="loss"\]'\)/);
  assert.match(source,/getComputedStyle\(element\)/);
  assert.match(source,/getBoundingClientRect\(\)/);
  assert.match(source,/loss stage control is missing from DOM/);
  assert.match(source,/loss stage control is not visibly actionable/);
  assert.match(source,/page\.mouse\.click\(lossControl\.x \+ lossControl\.width \/ 2, lossControl\.y \+ lossControl\.height \/ 2\)/);
  assert.doesNotMatch(source,/lossButton\.waitFor/);
  assert.doesNotMatch(source,/lossButton\.boundingBox/);
  assert.doesNotMatch(source,/lossButton\.evaluate/);
  assert.doesNotMatch(source,/force:\s*true/);
  assert.match(source,/loss stage aria-selected did not become true/);
  assert.match(source,/yearly billing click did not change a price/);
  assert.match(source,/English route did not render html lang=en/);
});
