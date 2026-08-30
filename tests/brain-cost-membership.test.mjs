import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCostMembership } from '../tools/verify-brain-cost-membership.mjs';

test('blocks production readiness when a future active component has no cost class', () => {
  const result = verifyCostMembership([
    { componentKey: 'make:999', active: true, classificationState: 'UNCLASSIFIED' },
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blocked, ['make:999']);
});

test('inactive unclassified component remains visible without blocking production', () => {
  const result = verifyCostMembership([
    { componentKey: 'make:999', active: false, classificationState: 'UNCLASSIFIED' },
  ]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.visibleUnclassified, ['make:999']);
});

test('duplicate and missing component keys fail closed', () => {
  assert.throws(() => verifyCostMembership([
    { componentKey: 'make:999', active: true, classificationState: 'CLASSIFIED' },
    { componentKey: 'make:999', active: true, classificationState: 'CLASSIFIED' },
  ]), /duplicate component key/);
  assert.throws(() => verifyCostMembership([{ active: true, classificationState: 'CLASSIFIED' }]), /componentKey/);
});
