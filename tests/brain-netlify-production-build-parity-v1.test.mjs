import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');

test('website lane executes the complete Netlify production build chain before merge',()=>{
  assert.match(workflow,/netlify-build-parity:/);
  assert.match(workflow,/pricing-build-integrity\.mjs capture/);
  assert.match(workflow,/prijzen-uit-de-homepage\.mjs/);
  assert.match(workflow,/pricing-build-integrity\.mjs restore/);
  assert.match(workflow,/apply-i18n\.mjs/);
  assert.match(workflow,/build-localized-routes\.mjs/);
  assert.match(workflow,/genereer-sitemap\.mjs/);
  assert.match(workflow,/bouw-release-evidence\.mjs/);
  assert.match(workflow,/STATIC_I18N_NETWORK: '0'/);
  assert.match(workflow,/STATIC_I18N_CONCURRENCY: '1'/);
});
