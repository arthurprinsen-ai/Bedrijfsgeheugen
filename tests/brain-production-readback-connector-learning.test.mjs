import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const INCIDENT = 'brain/learning/incidents/production-readback-connector-503-2026-09-15.json';
const DOC = 'docs/learning/production-readback-connector-503-2026-09-15.md';
const LEDGER = 'docs/development-ledger-events/2026-09-15-1014-production-readback-connector-503.md';

test('production connector readiness 503 learning remains machine-readable and fail-closed', async () => {
  const [incidentRaw, doc, ledger] = await Promise.all([
    readFile(INCIDENT, 'utf8'),
    readFile(DOC, 'utf8'),
    readFile(LEDGER, 'utf8')
  ]);

  const incident = JSON.parse(incidentRaw);
  assert.equal(incident.version, 'PRODUCTION-READBACK-CONNECTOR-503-v1');
  assert.equal(incident.fingerprint, 'production-readback|connector-readiness|route-overlap-and-transient-503-v1');
  assert.equal(incident.guard, 'production-readback-connector-resilience-v1');
  assert.equal(incident.observed.exactRoute, '/api/connectors/readiness');
  assert.equal(incident.observed.wildcardRoute, '/api/connectors/*');
  assert.equal(incident.observed.netlifyExclusionRequired, '/api/connectors/readiness');
  assert.equal(incident.observed.reproduced, true);
  assert.equal(incident.evidence.productionReadbackConclusion, 'success');
  assert.equal(incident.recovery.manualGreenAllowed, false);

  for (const guard of [
    'public_readiness_route_is_exact',
    'connector_wildcard_excludes_readiness',
    'bounded_retry_for_transient_5xx',
    'cache_busting_readback',
    'explicit_request_timeout',
    'fail_closed_after_retry_budget',
    'exact_sha_release_readback'
  ]) {
    assert.ok(incident.requiredPreflight.includes(guard), `missing prevention guard ${guard}`);
  }

  for (const block of [
    'wildcard_can_capture_readiness',
    'readiness_stays_5xx_after_bounded_retry',
    'production_sha_not_verified_when_deployment_is_required'
  ]) {
    assert.ok(incident.releaseBlocks.includes(block), `missing release block ${block}`);
  }

  for (const token of [
    'production-readback|connector-readiness|route-overlap-and-transient-503-v1',
    'production-readback-connector-resilience-v1',
    '/api/connectors/readiness',
    '/api/connectors/*',
    'bounded retry',
    'fail closed',
    'merge is never completion'
  ]) {
    assert.ok(doc.toLowerCase().includes(token.toLowerCase()), `learning doc missing ${token}`);
  }

  for (const token of [
    'RECOVERY + IMPROVEMENT',
    'Production Release Readback run `34945747361` success',
    'tests/brain-production-readback-connector-learning.test.mjs',
    'deployment state is not application readiness'
  ]) {
    assert.ok(ledger.includes(token), `development ledger event missing ${token}`);
  }
});
