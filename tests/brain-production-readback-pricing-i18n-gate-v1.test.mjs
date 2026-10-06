import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/production-release-readback.yml','utf8');

test('production readback permanently executes pricing and i18n browser proof for website/manual scope', () => {
  assert.match(workflow,/Verify pricing interactions and English route in production/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
  assert.match(workflow,/readbackWorkflowChanged/);
  assert.match(workflow,/manualReadback/);
  assert.match(workflow,/if\(\(readbackWorkflowChanged \|\| manualReadback\) && !routes\.includes\('\/prijzen'\)\) routes\.push\('\/prijzen'\)/);
  assert.match(workflow,/browserRequired=websiteRequired \|\| portalRequired \|\| manualReadback/);
});

test('readback control-plane-only maintenance does not falsely require a production deploy', () => {
  assert.match(workflow,/readbackControlPlaneOnly/);
  assert.match(workflow,/websiteRequired=readbackControlPlaneOnly \? false : suites\.website === true/);
  assert.match(workflow,/portalRequired=readbackControlPlaneOnly \? false : suites\.portal === true/);
  assert.match(workflow,/deploymentRequired=browserRequired \|\| netlifyRuntimeRequired/);
});
