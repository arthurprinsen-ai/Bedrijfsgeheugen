import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_LEGACY_CALCULATION_SOURCES,
  LEGACY_CALCULATION_REGISTRY,
  evaluateRealLegacyCalculationParity
} from '../brain/operating-loop/legacy-calculation-registry.mjs';

const REQUIRED_REAL_CALCULATIONS = [
  'frisse-blik-maturity-score-v1',
  'frisse-blik-business-case-v1',
  'zelfscan-knowledge-risk-score-v1',
  'portal-handwork-cost-v1',
  'portal-esg-coverage-score-v1'
];

test('real legacy parity never treats synthetic calc-a/calc-b fixtures as production proof', () => {
  const ids = LEGACY_CALCULATION_REGISTRY.map(item => item.id);
  assert.equal(ids.includes('calc-a'), false);
  assert.equal(ids.includes('calc-b'), false);
  for (const id of REQUIRED_REAL_CALCULATIONS) assert.ok(ids.includes(id), `missing real legacy calculation ${id}`);
});

test('active legacy business calculation sources are explicitly audited', () => {
  assert.deepEqual(
    [...ACTIVE_LEGACY_CALCULATION_SOURCES].sort(),
    ['frisse-blik.html', 'klantportaal.html', 'zelfscan.html'].sort()
  );
  for (const item of LEGACY_CALCULATION_REGISTRY) {
    assert.ok(ACTIVE_LEGACY_CALCULATION_SOURCES.includes(item.legacySource), `${item.id}: source is not in audited active source set`);
    assert.ok(item.sourceFingerprint, `${item.id}: source fingerprint required`);
    assert.ok(item.canonicalService, `${item.id}: canonical service required`);
    assert.ok(Array.isArray(item.fixtures) && item.fixtures.length >= 2, `${item.id}: at least two frozen fixtures required`);
    assert.equal(typeof item.tolerance, 'number', `${item.id}: numeric tolerance required`);
  }
});

test('real legacy calculation registry is fail-closed and all registered fixtures prove parity', () => {
  const result = evaluateRealLegacyCalculationParity({expectedCalculationIds: REQUIRED_REAL_CALCULATIONS});
  assert.equal(result.status, 'PROVEN');
  assert.equal(result.missing.length, 0);
  assert.equal(result.failed, 0);
  assert.equal(result.proven, REQUIRED_REAL_CALCULATIONS.length);
});
