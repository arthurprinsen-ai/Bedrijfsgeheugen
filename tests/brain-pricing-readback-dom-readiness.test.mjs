import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production pricing readback waits for actionable DOM controls, not an implementation marker', () => {
  const verifier = readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  assert.match(verifier, /data-bg-stage="loss"/);
  assert.match(verifier, /data-bg-price-tab="run"/);
  assert.match(verifier, /data-bg-billing="yearly"/);
  const waitBlock = verifier.slice(verifier.indexOf('await page.waitForFunction'), verifier.indexOf('// Lifecycle toggle'));
  assert.doesNotMatch(waitBlock, /bgPricingInteractions/);
});
