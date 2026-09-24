import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing production verifier uses bounded readiness retry without weakening interaction proof',()=>{
  const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(source,/for \(let attempt = 1; attempt <= 2; attempt \+= 1\)/);
  assert.match(source,/pricing production readiness failed after 2 bounded attempts/);
  assert.match(source,/interaction_proof=' \+ nonce/);
  assert.match(source,/locator\('body'\)\.waitFor\(\{ state:'visible', timeout:15_000 \}\)/);
  assert.match(source,/html\[data-bg-pricing-interactions="ready-v3"\]/);
  assert.match(source,/\[data-bg-stage="loss"\]/);
  assert.match(source,/\[data-bg-price-tab="run"\]/);
  assert.match(source,/\[data-bg-billing="yearly"\]/);
  assert.match(source,/data-bg-language-option="en"/);
  assert.doesNotMatch(source,/force:\s*true/);
});
