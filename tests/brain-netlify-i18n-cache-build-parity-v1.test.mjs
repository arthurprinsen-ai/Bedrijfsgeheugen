import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');

test('website Netlify build parity uses production static i18n cache policy',()=>{
  const marker=workflow.indexOf('netlify-build-parity:');
  assert.ok(marker>=0,'netlify-build-parity job missing');
  const block=workflow.slice(marker, marker+9000);
  assert.match(block,/STATIC_I18N_NETWORK:\s*'0'/);
  assert.match(block,/STATIC_I18N_REQUIRE_CACHE:\s*'1'/);
  assert.match(block,/pricing-build-integrity\.mjs capture/);
  assert.match(block,/build-localized-routes\.mjs/);
  assert.match(block,/bouw-release-evidence\.mjs/);
});
