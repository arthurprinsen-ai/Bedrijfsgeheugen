import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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

test('delivery preflight fails closed when a reused guard has no actionable knowledge', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'brain-preflight-guard-'));
  const browserGuardPath = path.join(dir, 'browser-evidence-guard-contract.json');
  try {
    const browserGuard = JSON.parse(await readFile(new URL('../config/browser-evidence-guard-contract.json', import.meta.url), 'utf8'));
    browserGuard.knownFailureFingerprints.push('browser-evidence|future|unexplained-v1');
    await writeFile(browserGuardPath, JSON.stringify(browserGuard, null, 2));

    await assert.rejects(
      () => loadDeliveryPreflight({ browserGuardPath }),
      /actionable guard knowledge missing.*browser-evidence\|future\|unexplained-v1/i,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('unexplained reused guard failure is a canonical registered prevention guard', async () => {
  const fingerprint = 'learning|preflight|reused-guard-without-actionable-knowledge-v1';
  const [preflight, inventory] = await Promise.all([
    loadDeliveryPreflight(),
    buildGuardRegressionInventory(),
  ]);

  assert.ok(inventory.fingerprints.includes(fingerprint), 'runtime preflight knowledge failure must be in canonical guard inventory');
  assert.ok(preflight.reusedGuards.includes(fingerprint), 'runtime preflight knowledge failure must be mandatory preflight knowledge');
  const knowledge = preflight.guardKnowledge.find(item => item.fingerprint === fingerprint);
  assert.equal(knowledge?.regressionContract, 'tests/branch-delivery-guard-knowledge-preflight.test.mjs');
  assert.equal(knowledge?.owner, 'agent-reliability');
});
