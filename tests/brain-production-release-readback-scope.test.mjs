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

test('production readback is a canonical Brain/Powerhouse delivery-control-plane contract', async () => {
  const contract = JSON.parse(await readFile('brain/contracts/production-readback-v1.json', 'utf8'));
  assert.equal(contract.id, 'production-readback-v1');
  assert.equal(contract.owner, 'delivery-control-plane');
  assert.equal(contract.system, 'BRAIN/Powerhouse');
  assert.equal(contract.status, 'canonical');
  assert.equal(contract.sourceOfTruth, '.github/workflows/production-release-readback.yml');
  assert.equal(contract.requiredGate, 'Required test');
  assert.equal(contract.contractTest, 'tests/brain-production-release-readback-scope.test.mjs');
  assert.equal(contract.principles.failClosed, true);
  assert.equal(contract.principles.noParallelReleaseMechanism, true);
  assert.equal(contract.principles.noMakeDependency, true);
  assert.equal(contract.principles.exactReleaseIdentity, true);
  assert.equal(contract.principles.contentReadbackRequired, true);
  assert.equal(contract.principles.transient5xxPolicy, 'bounded-retry-then-fail-closed');
  assert.equal(contract.connectorReadiness.maxAttempts, 8);
  assert.equal(contract.connectorReadiness.terminalFailure, true);
  assert.equal(contract.connectorReadiness.publicRoute, '/api/connectors/readiness');
  assert.equal(contract.connectorReadiness.excludedFromAuthenticatedWildcard, true);
});

test('production readback failures are part of the canonical universal learning loop', async () => {
  const [contract, learning, lesson] = await Promise.all([
    readFile('brain/contracts/production-readback-v1.json', 'utf8').then(JSON.parse),
    readFile('config/universal-closed-loop-learning.json', 'utf8').then(JSON.parse),
    readFile('docs/brain/lessons/production-readback-readiness-503-2026-09-15.json', 'utf8').then(JSON.parse),
  ]);
  assert.equal(contract.learning.contract, learning.version);
  assert.equal(contract.learning.scope, learning.scope);
  assert.equal(contract.learning.eventKind, 'ERROR');
  assert.equal(contract.learning.fingerprint, 'production-readback-http-5xx-v1');
  assert.equal(contract.learning.rootCausePolicy, 'evidence-before-hypothesis');
  assert.equal(contract.learning.preventionRule, 'ISOLATE_PUBLIC_READINESS_AND_REQUIRE_EXACT_PRODUCTION_READBACK');
  assert.equal(contract.learning.regressionTest, 'tests/brain-production-release-readback-scope.test.mjs');
  assert.equal(contract.learning.writeback, 'canonical-universal-learning');
  assert.equal(contract.learning.knownLesson, 'docs/brain/lessons/production-readback-readiness-503-2026-09-15.json');
  assert.equal(lesson.fingerprint, contract.learning.fingerprint);
  assert.equal(lesson.preventionRule, contract.learning.preventionRule);
  assert.equal(lesson.status, 'PROVEN');
  assert.equal(lesson.learning.noParallelMechanism, true);
  assert.equal(lesson.learning.noMakeDependency, true);
  assert.deepEqual(contract.learning.requiredFields, learning.required_learning_fields);
  assert.ok(learning.required_lifecycle.includes('learning_writeback'));
  assert.ok(learning.required_lifecycle.includes('prevention_reuse'));
});

test('terminal production readback failures emit canonical Brain learning evidence', async () => {
  const workflow = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(workflow, /Capture production readback failure as Brain learning evidence/);
  assert.match(workflow, /createObservedFailure/);
  assert.match(workflow, /routeObservedFailureToLearning/);
  assert.match(workflow, /stage:\s*'PRODUCTION'/);
  assert.match(workflow, /component:\s*'production-readback'/);
  assert.match(workflow, /production-readback-http-5xx-v1/);
  assert.match(workflow, /delivery-failure-production-readback\.json/);
  assert.match(workflow, /delivery-learning-route-production-readback\.json/);
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
