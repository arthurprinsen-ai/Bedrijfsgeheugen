import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeliveryMetadata, validateDeliveryMetadata } from '../tools/delivery/delivery-hygiene.mjs';
import policy from '../config/powerhouse-delivery-hygiene-v1.json' with { type: 'json' };

const SHA = 'a'.repeat(40);

test('docs-only closure alias canonicalizes to docs before admission', () => {
  const metadata = parseDeliveryMetadata(`Obligation-ID: docs-closure-v1
Delivery-Lane: docs
Candidate-Type: closure
Base-SHA: ${SHA}
Supersedes: none`);
  assert.equal(metadata.deliveryLane, 'docs');
  assert.equal(metadata.candidateType, 'docs');
  assert.equal(validateDeliveryMetadata(metadata, policy).ok, true);
});

test('closure alias remains invalid outside docs lane', () => {
  const metadata = parseDeliveryMetadata(`Obligation-ID: unsafe-closure-v1
Delivery-Lane: automation
Candidate-Type: closure
Base-SHA: ${SHA}
Supersedes: none`);
  assert.equal(metadata.candidateType, 'closure');
  assert.deepEqual(validateDeliveryMetadata(metadata, policy).errors, ['CANDIDATE_TYPE_INVALID']);
});
