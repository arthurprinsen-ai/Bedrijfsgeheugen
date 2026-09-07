import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSuccessorCreation } from '../tools/brain-delivery-system.mjs';

test('main movement without overlap forbids creating a successor', () => {
  assert.deepEqual(evaluateSuccessorCreation({
    priorCandidateOpen: true,
    driftDecision: { action:'KEEP_TESTED_FEATURE', reason:'non-overlapping-main-drift', overlap:[], contractOverlap:[] },
  }), {
    allowed: false,
    action: 'REUSE_EXISTING_CANDIDATE',
    reason: 'successor-forbidden-without-sync-required',
  });
});

test('real overlap permits synchronization but does not require a new successor', () => {
  assert.deepEqual(evaluateSuccessorCreation({
    priorCandidateOpen: true,
    driftDecision: { action:'SYNC_REQUIRED', reason:'changed-path-overlap', overlap:['.github/workflows/required-test.yml'], contractOverlap:[] },
  }), {
    allowed: false,
    action: 'SYNC_EXISTING_CANDIDATE',
    reason: 'sync-existing-candidate-first',
  });
});

test('successor is allowed only when sync is required and existing candidate cannot be safely synchronized', () => {
  assert.deepEqual(evaluateSuccessorCreation({
    priorCandidateOpen: true,
    existingCandidateSynchronizable: false,
    driftDecision: { action:'SYNC_REQUIRED', reason:'declared-contract-overlap', overlap:[], contractOverlap:['delivery-control-plane'] },
  }), {
    allowed: true,
    action: 'CREATE_SUCCESSOR',
    reason: 'sync-required-existing-candidate-unsynchronizable',
  });
});
