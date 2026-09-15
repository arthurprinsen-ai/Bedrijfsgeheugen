import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');

test('production incident learning is machine-readable and closes the full learning loop', async () => {
  const ledger = JSON.parse(await read('brain/learning/production-incidents.json'));
  assert.equal(ledger.contract_id, 'production-incident-learning-v1');
  assert.deepEqual(ledger.closed_loop, [
    'detect',
    'prioritize',
    'execute',
    'test',
    'production',
    'readback',
    'outcome',
    'root_cause',
    'regression_prevention',
    'writeback',
  ]);

  const incident = ledger.incidents.find(item => item.id === '2026-09-15-production-readback-and-connector-readiness');
  assert.ok(incident, 'production incident learning must remain in the canonical ledger');
  assert.equal(incident.status, 'closed_with_enforced_prevention');
  assert.ok(incident.root_causes.length >= 4);
  assert.ok(incident.invariants.length >= 6);
  assert.ok(incident.enforcement.length >= 4);
  assert.match(incident.learning_rule, /machine-enforced invariant and regression test/i);
});

test('every recorded production prevention control points to repository enforcement', async () => {
  const ledger = JSON.parse(await read('brain/learning/production-incidents.json'));
  for (const incident of ledger.incidents) {
    for (const control of incident.enforcement) {
      const [implementation, regressionTest] = await Promise.all([
        read(control.implementation),
        read(control.regression_test),
      ]);
      assert.ok(implementation.length > 0, `${control.control_id} implementation must exist`);
      assert.ok(regressionTest.length > 0, `${control.control_id} regression test must exist`);
    }
  }
});

test('connector readiness route isolation and bounded fail-closed retry remain enforced', async () => {
  const [portalConnectors, readiness, workflow] = await Promise.all([
    read('netlify/functions/portal-connectors.mjs'),
    read('netlify/functions/connector-readiness.mjs'),
    read('.github/workflows/production-release-readback.yml'),
  ]);

  assert.match(portalConnectors, /path:\s*['"]\/api\/connectors\/\*['"]/);
  assert.match(portalConnectors, /excludedPath:\s*['"]\/api\/connectors\/readiness['"]/);
  assert.match(readiness, /path:\s*['"]\/api\/connectors\/readiness['"]/);
  assert.match(workflow, /for attempt in \$\(seq 1 8\)/);
  assert.match(workflow, /Connector readiness stayed unhealthy after 8 attempts/);
  assert.match(workflow, /exit 1/);
});

test('production truth remains exact-SHA and delivery-lane scoped', async () => {
  const workflow = await read('.github/workflows/production-release-readback.yml');
  assert.match(workflow, /createDeliveryPlan/);
  assert.match(workflow, /deriveRequiredTestSuites/);
  assert.match(workflow, /EXPECTED_COMMIT:\s*\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /deployment_required/);
  assert.match(workflow, /website_required/);
  assert.match(workflow, /verify-production-release\.mjs/);
});
