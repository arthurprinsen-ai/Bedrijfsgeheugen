import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeliveryMetadata, validateDeliveryMetadata } from '../tools/delivery/delivery-hygiene.mjs';

const SHA = 'a'.repeat(40);
const policy = {
  allowedLanes: ['backend','portal','website','automation','security','incident','dependency','docs'],
  allowedCandidateTypes: ['implementation','recovery','security','dependency','docs','promotion'],
};

test('docs closure alias canonicalizes before delivery admission', () => {
  const metadata = parseDeliveryMetadata(`Obligation-ID: docs-closure-v1\nDelivery-Lane: docs\nCandidate-Type: closure\nBase-SHA: ${SHA}\nSupersedes: none`);
  assert.equal(metadata.deliveryLane, 'docs');
  assert.equal(metadata.candidateType, 'docs');
  assert.equal(validateDeliveryMetadata(metadata, policy).ok, true);
});

test('closure remains fail-closed outside docs lane', () => {
  const metadata = parseDeliveryMetadata(`Obligation-ID: bad-closure-v1\nDelivery-Lane: automation\nCandidate-Type: closure\nBase-SHA: ${SHA}\nSupersedes: none`);
  assert.equal(metadata.candidateType, 'closure');
  assert.deepEqual(validateDeliveryMetadata(metadata, policy).errors, ['CANDIDATE_TYPE_INVALID']);
});
