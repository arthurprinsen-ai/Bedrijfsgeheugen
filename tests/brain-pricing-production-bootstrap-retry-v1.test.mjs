import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('pricing production bootstrap retries transient page/body/runtime readiness on a fresh page',()=>{
  assert.match(source,/async function openPricingPage/);
  assert.match(source,/\{ attempts = 3 \} = \{\}/);
  assert.match(source,/browser\.newPage\(\{ viewport:\{ width:390, height:844 \} \}\)/);
  assert.match(source,/html\[data-bg-pricing-interactions="ready-v3"\]/);
  assert.match(source,/error\?\.name !== 'TimeoutError'/);
  assert.match(source,/setTimeout\(resolve, 1_000 \* attempt\)/);
});

test('pricing bootstrap remains fail closed and does not weaken interaction proof',()=>{
  assert.match(source,/if \(attempt >= attempts \|\| error\?\.name !== 'TimeoutError'\) throw error/);
  assert.match(source,/lossButton\.click\(\{ timeout:15_000 \}\)/);
  assert.doesNotMatch(source,/force:\s*true/);
  assert.doesNotMatch(source,/evaluate\([^)]*\.click\(/);
});
