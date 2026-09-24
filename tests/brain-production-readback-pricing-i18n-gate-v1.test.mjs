import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/production-release-readback.yml','utf8');

test('production readback permanently executes pricing and i18n browser proof', () => {
  assert.match(workflow,/Verify pricing interactions and English route in production/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
  assert.match(workflow,/readbackWorkflowChanged/);
  assert.match(workflow,/routes\.includes\('\/prijzen'\)/);
  assert.match(workflow,/browserRequired=websiteRequired \|\| portalRequired \|\| readbackWorkflowChanged/);
});
