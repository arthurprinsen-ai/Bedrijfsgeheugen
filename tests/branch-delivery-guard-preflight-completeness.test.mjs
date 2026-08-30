import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuardRegressionInventory } from '../tools/delivery-guard-regression-inventory.mjs';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

test('mandatory delivery preflight reuses every canonical guard-registry fingerprint automatically', async () => {
  const inventory = await buildGuardRegressionInventory();
  const decision = await loadDeliveryPreflight({ component: 'shared' });
  const reused = new Set(decision.reusedGuards);
  const missing = inventory.fingerprints.filter(fingerprint => !reused.has(fingerprint));
  assert.deepEqual(missing, [], `preflight is missing canonical guard fingerprints: ${missing.join(', ')}`);
});
