import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeliveryMetadata, evaluateAdmission, evaluateSupersession, evaluatePromotionSerialization, parseWriterLease, evaluateWriterLease } from '../tools/delivery/delivery-hygiene.mjs';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const SHA_C = 'c'.repeat(40);
const policy = {
  version: 'POWERHOUSE-DELIVERY-HYGIENE-v1',
  wip: { maxExecutable: 5 },
  priorityLanes: ['security', 'incident'],
  nonProductLanes: ['dependency', 'docs'],
  allowedLanes: ['backend', 'portal', 'website', 'automation', 'security', 'incident', 'dependency', 'docs'],
  allowedCandidateTypes: ['implementation', 'recovery', 'security', 'dependency', 'docs', 'promotion'],
};

function candidate({ number, obligationId, lane = 'backend', type = 'implementation', baseSha = SHA_A, declaredBaseSha = baseSha, headSha = SHA_B, supersedes = null, conflictContracts = [], executable = true } = {}) {
  return {
    number,
    executable,
    baseSha,
    headSha,
    conflictContracts,
    metadata: { obligationId, deliveryLane: lane, candidateType: type, baseSha: declaredBaseSha, supersedes },
  };
}

test('parses canonical delivery metadata', () => {
  const metadata = parseDeliveryMetadata(`Obligation-ID: powerhouse-delivery-hygiene-v1\nDelivery-Lane: automation\nCandidate-Type: implementation\nBase-SHA: ${SHA_A}\nSupersedes: none`);
  assert.equal(metadata.obligationId, 'powerhouse-delivery-hygiene-v1');
  assert.equal(metadata.deliveryLane, 'automation');
  assert.equal(metadata.candidateType, 'implementation');
  assert.equal(metadata.baseSha, SHA_A);
  assert.equal(metadata.supersedes, null);
});

test('admits one executable candidate', () => {
  const result = evaluateAdmission({ candidate: candidate({ number: 1, obligationId: 'BG-1' }), openCandidates: [], policy, currentMainSha: SHA_A });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
});

test('blocks a second active candidate for the same obligation', () => {
  const current = candidate({ number: 2, obligationId: 'BG-1' });
  const openCandidates = [candidate({ number: 1, obligationId: 'BG-1', headSha: SHA_C })];
  const result = evaluateAdmission({ candidate: current, openCandidates, policy, currentMainSha: SHA_A });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'BLOCKED_DUPLICATE_OBLIGATION');
});

test('admits an explicit valid same-obligation successor', () => {
  const predecessor = candidate({ number: 1, obligationId: 'BG-1', headSha: SHA_C });
  const successor = candidate({ number: 2, obligationId: 'BG-1', supersedes: 1 });
  const result = evaluateAdmission({ candidate: successor, openCandidates: [predecessor], policy, currentMainSha: SHA_A });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
  assert.equal(evaluateSupersession({ successor, predecessor }).safe, true);
});

test('blocks cross-obligation supersession', () => {
  const predecessor = candidate({ number: 1, obligationId: 'BG-OTHER', headSha: SHA_C });
  const successor = candidate({ number: 2, obligationId: 'BG-1', supersedes: 1 });
  const result = evaluateAdmission({ candidate: successor, openCandidates: [predecessor], policy, currentMainSha: SHA_A });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'BLOCKED_LINEAGE_AMBIGUOUS');
});

test('applies recoverable capacity waiting to executable WIP but excludes docs and dependency candidates', () => {
  const conflictContracts = ['delivery-control-plane'];
  const openCandidates = [1, 2, 3, 4, 5].map(number => candidate({ number, obligationId: `BG-${number}`, conflictContracts }));
  const waiting = evaluateAdmission({ candidate: candidate({ number: 6, obligationId: 'BG-6', conflictContracts }), openCandidates, policy, currentMainSha: SHA_A });
  assert.equal(waiting.ok, false);
  assert.equal(waiting.state, 'WAITING_CAPACITY');
  assert.equal(waiting.reason, 'FINISH_EXISTING_WORK_FIRST');
  const docs = evaluateAdmission({ candidate: candidate({ number: 7, obligationId: 'DOC-1', lane: 'docs', type: 'docs', conflictContracts }), openCandidates, policy, currentMainSha: SHA_A });
  assert.equal(docs.state, 'ADMITTED');
});

test('uses the git-derived immutable base as authority and reports stale mutable PR base metadata', () => {
  const result = evaluateAdmission({ candidate: candidate({ number: 1, obligationId: 'BG-1', baseSha: SHA_A, declaredBaseSha: SHA_C }), openCandidates: [], policy, currentMainSha: SHA_A });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
  assert.deepEqual(result.metadataBaseDrift, {
    declaredBaseSha: SHA_C,
    authoritativeBaseSha: SHA_A,
  });
});

test('does not force rebuild merely because unrelated main moved', () => {
  const result = evaluateAdmission({ candidate: candidate({ number: 1, obligationId: 'BG-1', baseSha: SHA_A }), openCandidates: [], policy, currentMainSha: SHA_C });
  assert.equal(result.state, 'ADMITTED');
});

test('serializes overlapping promotion contracts but keeps independent scopes parallel', () => {
  const current = candidate({ number: 2, obligationId: 'BG-2', type: 'promotion', conflictContracts: ['delivery-control-plane'] });
  const overlapping = candidate({ number: 1, obligationId: 'BG-1', type: 'promotion', conflictContracts: ['delivery-control-plane'] });
  const independent = candidate({ number: 3, obligationId: 'BG-3', type: 'promotion', conflictContracts: ['website-shell-contract'] });
  assert.equal(evaluatePromotionSerialization({ candidate: current, openCandidates: [overlapping] }).state, 'BLOCKED_PROMOTION_SERIALIZATION');
  assert.equal(evaluatePromotionSerialization({ candidate: current, openCandidates: [independent] }).state, 'ADMITTED');
});


test('terminal writer lease binds an immutable exact head', () => {
  const body = `Writer-Lease-State: TERMINAL_DELIVERY
Writer-Lease-Owner: powerhouse-terminal-delivery
Writer-Lease-Scope: BG-LEASE
Writer-Lease-Head: ${SHA_B}
Writer-Lease-NonOwner-Action: DEFER
Writer-Lease-Release: MERGED_AND_PRODUCTION_READBACK_AND_LEARNING_WRITEBACK`;
  assert.deepEqual(parseWriterLease(body), {
    state: 'TERMINAL_DELIVERY',
    owner: 'powerhouse-terminal-delivery',
    scope: 'BG-LEASE',
    headSha: SHA_B,
    nonOwnerAction: 'DEFER',
    release: 'MERGED_AND_PRODUCTION_READBACK_AND_LEARNING_WRITEBACK',
  });
  const exact = evaluateWriterLease({ body, candidateHeadSha: SHA_B });
  assert.equal(exact.ok, true);
  assert.equal(exact.state, 'TERMINAL_LEASE_BOUND');
  const drift = evaluateWriterLease({ body, candidateHeadSha: SHA_C });
  assert.equal(drift.ok, false);
  assert.equal(drift.state, 'BLOCKED_TERMINAL_LEASE_HEAD_DRIFT');
  assert.deepEqual(drift.reasons, ['TERMINAL_LEASE_HEAD_DRIFT']);
});

test('non-terminal lease state permits controlled recovery head mutation', () => {
  const body = `Writer-Lease-State: RECOVERY
Writer-Lease-Owner: powerhouse-terminal-delivery
Writer-Lease-Scope: BG-LEASE
Writer-Lease-Head: ${SHA_B}`;
  const result = evaluateWriterLease({ body, candidateHeadSha: SHA_C });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'LEASE_INACTIVE');
});
