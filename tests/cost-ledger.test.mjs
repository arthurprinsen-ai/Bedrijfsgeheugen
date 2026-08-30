import test from 'node:test';
import assert from 'node:assert/strict';
import { createCostSnapshot } from '../platform/cost/cost-ledger.mjs';

const row = {
  componentKey: 'make:159',
  creditsTotal: 135,
  operationsTotal: 20,
  dataTransferTotal: 1_000,
  verifiedOutcomes: 3,
  latencyMs: 9_000,
};

test('computes cumulative deltas and normalized cost per verified outcome', () => {
  const snapshot = createCostSnapshot({
    sampledAt: '2026-08-30T08:00:00Z',
    components: [row],
    previous: {
      components: [{
        ...row,
        creditsTotal: 100,
        operationsTotal: 10,
        dataTransferTotal: 500,
      }],
    },
  });

  assert.equal(snapshot.components[0].creditsDelta, 35);
  assert.equal(snapshot.components[0].operationsDelta, 10);
  assert.equal(snapshot.components[0].creditsPerVerifiedOutcome, 35 / 3);
  assert.equal(snapshot.components[0].latencyMsPerVerifiedOutcome, 3_000);
  assert.deepEqual(snapshot.changedComponentIds, ['make:159']);
});

test('identical counters do not create changed components', () => {
  const snapshot = createCostSnapshot({
    sampledAt: '2026-08-30T09:00:00Z',
    components: [row],
    previous: { components: [row] },
  });

  assert.deepEqual(snapshot.changedComponentIds, []);
  assert.equal(snapshot.components[0].creditsPerVerifiedOutcome, 0);
});

test('zero verified outcomes never converts technical runs into business value', () => {
  const snapshot = createCostSnapshot({
    sampledAt: '2026-08-30T09:00:00Z',
    components: [{ ...row, verifiedOutcomes: 0 }],
  });

  assert.equal(snapshot.components[0].creditsPerVerifiedOutcome, null);
  assert.equal(snapshot.components[0].latencyMsPerVerifiedOutcome, null);
});

test('rejects duplicate keys and negative cumulative counters', () => {
  assert.throws(() => createCostSnapshot({
    sampledAt: '2026-08-30T09:00:00Z',
    components: [row, row],
  }), /duplicate component key/);
  assert.throws(() => createCostSnapshot({
    sampledAt: '2026-08-30T09:00:00Z',
    components: [{ ...row, creditsTotal: -1 }],
  }), /non-negative/);
});
