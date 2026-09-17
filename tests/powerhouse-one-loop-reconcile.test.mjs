import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileOneLoopRun } from '../tools/delivery/one-loop-reconcile.mjs';

test('stale lease becomes a single recover action', () => {
  const result = reconcileOneLoopRun({
    state: 'EXECUTING',
    leaseExpiresAt: '2026-09-17T17:59:00Z',
    activeCandidates: ['sha-a'],
    candidateSha: 'sha-a',
    sideEffectAlreadyApplied: false,
  }, Date.parse('2026-09-17T18:00:00Z'));
  assert.equal(result.lease, 'RECOVER');
  assert.equal(result.action, 'RECOVER');
});

test('proven fulfilled state is an idempotent terminal no-op', () => {
  const result = reconcileOneLoopRun({
    state: 'FULFILLED',
    leaseExpiresAt: '2026-09-17T17:00:00Z',
    evidence: {
      exactHeadVerified: true,
      protectedMergeVerified: true,
      runtimeReadbackVerified: true,
      learningWritebackVerified: true,
    },
  }, Date.parse('2026-09-17T18:00:00Z'));
  assert.equal(result.action, 'NOOP_TERMINAL');
  assert.equal(result.lease, 'TERMINAL');
});
