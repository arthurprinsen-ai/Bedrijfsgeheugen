import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const verifier=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing verifier gates on actionable DOM and proves behavior',()=>{
  assert.match(verifier,/Behavior-first readiness/);
  assert.match(verifier,/document\.querySelector\('\[data-bg-stage="loss"\]'\)/);
  assert.match(verifier,/document\.querySelector\('\[data-bg-price-tab="run"\]'\)/);
  assert.match(verifier,/document\.querySelector\('\[data-bg-billing="yearly"\]'\)/);
  assert.match(verifier,/document\.querySelector\('\[data-monthly\]\[data-yearly\]'\)/);
  assert.doesNotMatch(verifier,/bgPricingInteractions === 'ready-v3'/);
  assert.match(verifier,/loss stage panel after click/);
  assert.match(verifier,/run tab aria-selected did not become true/);
  assert.match(verifier,/yearly billing click did not change a price/);
  assert.match(verifier,/roundtrip:'nl-en-nl'/);
});

test('ready marker remains diagnostic rather than terminal authority',()=>{
  assert.match(verifier,/readinessMarker/);
  assert.match(verifier,/absent-but-behavior-proven/);
});
