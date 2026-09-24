import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/production-release-readback.yml','utf8');
const verifier = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production readback permanently executes pricing and i18n browser proof', () => {
  assert.match(workflow,/Verify pricing interactions and English route in production/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
  assert.match(workflow,/readbackWorkflowChanged/);
  assert.match(workflow,/routes\.includes\('\/prijzen'\)/);
  assert.match(workflow,/browserRequired=websiteRequired \|\| portalRequired \|\| readbackWorkflowChanged/);
});


test('pricing browser proof waits on actual controls instead of generic body visibility', () => {
  assert.doesNotMatch(verifier,/locator\('body'\)\.waitFor\(\{ state:'visible'/);
  assert.match(verifier,/locator\('body'\)\.waitFor\(\{ state:'attached'/);
  for (const marker of [
    '[data-bg-stage="loss"]',
    '[data-bg-price-tab="run"]',
    '[data-bg-billing="yearly"]',
    'visible English Pricing text'
  ]) assert.ok(verifier.includes(marker), 'missing authoritative pricing proof marker: ' + marker);
});
