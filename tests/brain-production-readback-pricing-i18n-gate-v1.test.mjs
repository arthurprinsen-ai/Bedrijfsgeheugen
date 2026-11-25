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
  assert.match(workflow,/forceBrowser:manualReadback/);
  assert.match(workflow,/browserRequired[\s\S]*\}=applicability;/);
});

test('readback control-plane-only maintenance does not falsely require a production deploy', () => {
  assert.match(workflow,/readbackControlPlaneOnly/);
  // Control-plane-only changes have no runtime paths, hence no delivery lanes and no required suites.
  const applicability=fs.readFileSync('tools/delivery/netlify-deployment-applicability.mjs','utf8');
  assert.match(applicability,/const websiteRequired=requiredSuites\.website === true;/);
  assert.match(applicability,/const portalRequired=requiredSuites\.portal === true;/);
  assert.match(applicability,/const deploymentRequired=forceDeployment \|\| websiteRequired \|\| portalRequired \|\| netlifyRuntimeRequired;/);
});
