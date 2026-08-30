import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';
import { buildGuardRegressionInventory } from '../tools/delivery-guard-regression-inventory.mjs';

test('delivery preflight exposes actionable guard knowledge for every registered guard fingerprint', async () => {
  const [preflight, inventory] = await Promise.all([
    loadDeliveryPreflight(),
    buildGuardRegressionInventory(),
  ]);

  assert.ok(Array.isArray(preflight.guardKnowledge), 'preflight.guardKnowledge must be an array');

  const byFingerprint = new Map(preflight.guardKnowledge.map(item => [item.fingerprint, item]));
  for (const guard of inventory.guards) {
    const knowledge = byFingerprint.get(guard.fingerprint);
    assert.ok(knowledge, `missing guard knowledge for ${guard.fingerprint}`);
    assert.equal(typeof knowledge.rootCause, 'string');
    assert.ok(knowledge.rootCause.trim().length > 0, `missing rootCause for ${guard.fingerprint}`);
    assert.equal(typeof knowledge.fix, 'string');
    assert.ok(knowledge.fix.trim().length > 0, `missing fix for ${guard.fingerprint}`);
    assert.equal(typeof knowledge.preventionRule, 'string');
    assert.ok(knowledge.preventionRule.trim().length > 0, `missing preventionRule for ${guard.fingerprint}`);
    assert.match(knowledge.regressionContract, /^tests\/.*\.test\.mjs$/);
    assert.equal(typeof knowledge.owner, 'string');
    assert.ok(knowledge.owner.trim().length > 0, `missing owner for ${guard.fingerprint}`);
  }
});

test('every reused guard fingerprint has actionable preflight knowledge', async () => {
  const preflight = await loadDeliveryPreflight();
  const byFingerprint = new Map(preflight.guardKnowledge.map(item => [item.fingerprint, item]));

  for (const fingerprint of preflight.reusedGuards) {
    const knowledge = byFingerprint.get(fingerprint);
    assert.ok(knowledge, `reused guard has no actionable knowledge: ${fingerprint}`);
    assert.equal(typeof knowledge.rootCause, 'string');
    assert.ok(knowledge.rootCause.trim().length > 0, `missing rootCause for ${fingerprint}`);
    assert.equal(typeof knowledge.fix, 'string');
    assert.ok(knowledge.fix.trim().length > 0, `missing fix for ${fingerprint}`);
  }
});
