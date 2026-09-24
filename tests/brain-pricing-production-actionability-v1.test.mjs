import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing lifecycle proof uses a real mobile pointer click below sticky chrome',()=>{
  assert.match(source,/lossButton\.evaluate\(el => el\.scrollIntoView/);
  assert.doesNotMatch(source,/scrollIntoViewIfNeeded\(\)/);
  assert.match(source,/window\.scrollBy\(0, -120\)/);
  assert.match(source,/lossButton\.click\(\{ timeout:15_000 \}\)/);
  assert.doesNotMatch(source,/force:\s*true/);
  assert.doesNotMatch(source,/evaluate\([^)]*\.click\(/);
});
