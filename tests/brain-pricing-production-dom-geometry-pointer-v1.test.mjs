import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('pricing production verifier uses DOM geometry and a real pointer without locator geometry auto-waits', async()=>{
  const source=await readFile('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/html\[data-bg-pricing-interactions="ready-v3"\]/);
  assert.doesNotMatch(source,/lossButton\.waitFor\(\{ state:'visible'/);
  assert.doesNotMatch(source,/scrollIntoViewIfNeeded\(\)/);
  assert.doesNotMatch(source,/lossButton\.boundingBox\(\)/);
  assert.match(source,/getComputedStyle\(element\)/);
  assert.match(source,/getBoundingClientRect\(\)/);
  assert.match(source,/lossVisibility\.display === 'none'/);
  assert.match(source,/lossVisibility\.visibility === 'hidden'/);
  assert.match(source,/lossVisibility\.opacity === 0/);
  assert.match(source,/page\.mouse\.click\(lossBox\.x \+ lossBox\.width \/ 2, lossBox\.y \+ lossBox\.height \/ 2\)/);
  assert.match(source,/loss stage aria-selected did not become true/);
  assert.match(source,/yearly billing click did not change a price/);
  assert.match(source,/English route did not render html lang=en/);
  assert.doesNotMatch(source,/force:\s*true/);
});
