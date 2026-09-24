import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const verifier=fs.readFileSync('tools/site-shell/verify-targeted-website-routes.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/production-release-readback.yml','utf8');

test('targeted route verifier proves visible content without relying on body box visibility',()=>{
  assert.match(verifier,/locator\('body'\)\.waitFor\(\{ state:'attached'/);
  assert.match(verifier,/body\.innerText/);
  assert.match(verifier,/getBoundingClientRect\(\)/);
  assert.match(verifier,/style\.visibility!=='hidden'/);
  assert.doesNotMatch(verifier,/locator\('body'\)\.waitFor\(\{ state:'visible'/);
});

test('production readback refresh keeps pricing browser proof mandatory',()=>{
  assert.match(workflow,/visible-surface-route-proof-v1/);
  assert.match(workflow,/Verify pricing interactions and English route in production/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
