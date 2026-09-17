import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeliveryMetadata, evaluateAdmission, evaluateSupersession, evaluatePromotionSerialization } from '../tools/delivery/delivery-hygiene.mjs';

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

test('enforces executable WIP but excludes docs and dependency candidates', () => {
  const openCandidates = [1, 2, 3, 4, 5].map(number => candidate({ number, obligationId: `BG-${number}` }));
  const blocked = evaluateAdmission({ candidate: candidate({ number: 6, obligationId: 'BG-6' }), openCandidates, policy, currentMainSha: SHA_A });
  assert.equal(blocked.state, 'BLOCKED_WIP_LIMIT');
  const docs = evaluateAdmission({ candidate: candidate({ number: 7, obligationId: 'DOC-1', lane: 'docs', type: 'docs' }), openCandidates, policy, currentMainSha: SHA_A });
  assert.equal(docs.state, 'ADMITTED');
});

test('blocks a declared base that does not match the immutable PR base', () => {
  const result = evaluateAdmission({ candidate: candidate({ number: 1, obligationId: 'BG-1', baseSha: SHA_A, declaredBaseSha: SHA_C }), openCandidates: [], policy, currentMainSha: SHA_C });
  assert.equal(result.state, 'BLOCKED_STALE_IDENTITY');
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
