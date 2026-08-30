import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuardRegressionInventory } from '../tools/delivery-guard-regression-inventory.mjs';

test('every machine-readable guard regression contract resolves to an existing governed test', async () => {
  const inventory = await buildGuardRegressionInventory();
  assert.equal(inventory.failClosed, true);
  assert.ok(inventory.guards.length > 0, 'at least one guard contract required');
  assert.deepEqual(inventory.missingRegressionContracts, []);
  assert.deepEqual(inventory.missingRegressionFiles, []);
  assert.deepEqual(inventory.ungovernedRegressionFiles, []);
});

test('guard regression inventory exposes stable fingerprints for preflight reuse', async () => {
  const inventory = await buildGuardRegressionInventory();
  const fingerprints = new Set(inventory.fingerprints);
  assert.ok(fingerprints.has('learning|guard-regression|test-not-executed-v1'));
  assert.ok(fingerprints.has('delivery|branch-pr|stale-reuse-or-duplicate-owner-v1'));
});
