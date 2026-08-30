import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

const WORKFLOW = '.github/workflows/shared-agent-memory-tests.yml';
const POLICY = 'config/brain-delivery-system.json';
const CONTRACT = 'config/guard-regression-discovery-guard.json';

test('shared memory CI discovers future guard regression tests by family instead of hand-maintained filenames', async () => {
  const workflow = await readFile(WORKFLOW, 'utf8');
  assert.match(workflow, /tests\/\*guard\*\.test\.mjs/);
});

test('guard discovery regression family itself remains classified by BRAIN delivery', async () => {
  const policy = JSON.parse(await readFile(POLICY, 'utf8'));
  const backend = policy.lanes.find(lane => lane.id === 'backend');
  assert.ok(backend, 'backend lane required');
  assert.ok(backend.paths.includes('tests/branch-delivery-'), 'branch-delivery guard regressions must remain governed');
});

test('guard discovery failure is machine-readable and mandatory preflight knowledge', async () => {
  const contract = JSON.parse(await readFile(CONTRACT, 'utf8'));
  assert.equal(contract.version, 'GUARD-REGRESSION-DISCOVERY-v1');
  assert.equal(contract.failClosed, true);
  assert.equal(contract.knownFailure.fingerprint, 'learning|guard-regression|test-not-executed-v1');
  const decision = await loadDeliveryPreflight({ component: 'shared' });
  assert.ok(new Set(decision.reusedGuards).has(contract.knownFailure.fingerprint));
});
