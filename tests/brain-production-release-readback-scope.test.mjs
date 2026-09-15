import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateProductionReadback } from '../tools/site-shell/verify-production-release.mjs';

const SHA = '9353ecfc8d5a463a89963ae9b671318d3db02d54';

test('backend-only release can complete without a website deployment marker when no Netlify-hosted runtime changed', () => {
  assert.deepEqual(
    evaluateProductionReadback({ mergeSha: SHA, deploymentRequired: false, routesOk: true }),
    { status: 'LIVE_VERIFIED', reason: 'website_deployment_not_applicable' },
  );
});

test('website release still fails closed when exact deployed SHA is absent', () => {
  assert.throws(
    () => evaluateProductionReadback({ mergeSha: SHA, deploymentRequired: true, deployedSha: '', deployStatus: 'ready', routesOk: true }),
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

test('Netlify-hosted backend function changes require exact production deployment without forcing browser scope', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /netlify\/functions\//);
  assert.match(workflow, /deployment_required/);
  assert.match(workflow, /steps\.scope\.outputs\.deployment_required == 'true'/);
  assert.match(workflow, /website_required/);
  assert.match(workflow, /Install production browser verifier[\s\S]*website_required == 'true'/);
});

test('production readback treats its own control-plane-only maintenance as website deployment not applicable', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /production-release-readback\.yml/);
  assert.match(workflow, /brain-production-release-readback-scope\.test\.mjs/);
  assert.match(workflow, /readbackControlPlaneOnly/);
});

test('connector readiness tolerates bounded transient 5xx responses and still fails closed', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /for attempt in \$\(seq 1 8\)/);
  assert.match(workflow, /--connect-timeout 10/);
  assert.match(workflow, /--max-time 30/);
  assert.match(workflow, /Cache-Control: no-cache/);
  assert.match(workflow, /Pragma: no-cache/);
  assert.match(workflow, /Connector readiness stayed unhealthy after 8 attempts/);
  assert.match(workflow, /exit 1/);
});

test('production readback is owned by the canonical Brain delivery control plane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const controlPlane = policy.conflictContracts.find(contract => contract.id === 'delivery-control-plane');
  assert.ok(controlPlane, 'delivery-control-plane conflict contract must exist');
  assert.ok(controlPlane.paths.includes('.github/workflows/production-release-readback.yml'));
  assert.ok(controlPlane.paths.includes('tests/brain-production-release-readback-scope.test.mjs'));
});

test('public connector readiness is excluded from the authenticated connector wildcard', async () => {
  const [portalConnectors, readiness] = await Promise.all([
    readFile('netlify/functions/portal-connectors.mjs', 'utf8'),
    readFile('netlify/functions/connector-readiness.mjs', 'utf8'),
  ]);
  assert.match(portalConnectors, /path:\s*['"]\/api\/connectors\/\*['"]/);
  assert.match(portalConnectors, /excludedPath:\s*['"]\/api\/connectors\/readiness['"]/);
  assert.match(readiness, /path:\s*['"]\/api\/connectors\/readiness['"]/);
  assert.doesNotMatch(portalConnectors, /excludedPath:\s*['"]\/api\/connectors\/\*['"]/);
});
