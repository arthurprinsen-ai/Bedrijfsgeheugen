import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateProductionReadback } from '../tools/site-shell/verify-production-release.mjs';

const SHA = '9353ecfc8d5a463a89963ae9b671318d3db02d54';

test('backend-only release can complete without a website deployment marker', () => {
  assert.deepEqual(
    evaluateProductionReadback({
      mergeSha: SHA,
      deploymentRequired: false,
      routesOk: true,
    }),
    { status: 'LIVE_VERIFIED', reason: 'website_deployment_not_applicable' },
  );
});

test('website release still fails closed when exact deployed SHA is absent', () => {
  assert.throws(
    () => evaluateProductionReadback({
      mergeSha: SHA,
      deploymentRequired: true,
      deployedSha: '',
      deployStatus: 'ready',
      routesOk: true,
    }),
    /deployedSha must be a 40-character Git SHA/,
  );
});

test('production readback derives website applicability from canonical delivery lanes', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /createDeliveryPlan/);
  assert.match(workflow, /deriveRequiredTestSuites/);
  assert.match(workflow, /website_required/);
  assert.match(workflow, /steps\.scope\.outputs\.website_required == 'true'/);
  assert.match(workflow, /deployment-required/);
});

test('production readback treats its own control-plane-only maintenance as website deployment not applicable', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /production-release-readback\.yml/);
  assert.match(workflow, /production-release-readback-scope\.test\.mjs/);
  assert.match(workflow, /readbackControlPlaneOnly/);
});
