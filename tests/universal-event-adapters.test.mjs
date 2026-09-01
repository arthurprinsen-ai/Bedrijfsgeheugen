import test from 'node:test';
import assert from 'node:assert/strict';
import { createObservedFailure } from '../tools/delivery-learning.mjs';
import { deliveryFailureToUniversalEvent } from '../tools/universal-event-adapters.mjs';

test('maps a delivery failure losslessly into universal event evidence without changing its canonical fingerprint', () => {
  const observed = createObservedFailure({
    stage: 'PIPELINE',
    reason: 'Candidate push failed: Invalid username or token',
    component: 'weekblog',
    headSha: '1234567890abcdef1234567890abcdef12345678',
    evidenceRef: 'github-run:33487224772',
  });
  const event = deliveryFailureToUniversalEvent(observed, '2026-09-01T13:55:00.000Z');
  assert.equal(event.event_id, `github-delivery|${observed.fingerprint}|1234567890abcdef1234567890abcdef12345678`);
  assert.equal(event.fingerprint, observed.fingerprint);
  assert.equal(event.source_system, 'github');
  assert.equal(event.producer_id, 'unified-brain-delivery');
  assert.equal(event.domain, 'delivery');
  assert.equal(event.event_type, 'incident');
  assert.equal(event.severity, 'error');
  assert.equal(event.retention_tier, 2);
  assert.equal(event.durable_learning_required, true);
  assert.deepEqual(event.evidence_refs, ['github-run:33487224772']);
  assert.equal(JSON.stringify(event).includes('Invalid username or token'), true);
});

test('adapter redacts credential-shaped data inherited from failure reason', () => {
  const observed = createObservedFailure({
    stage: 'DEPLOY',
    reason: 'authorization: Bearer secret-value token=abc123 failed',
    component: 'release',
    headSha: 'abcdefabcdefabcdefabcdefabcdefabcdefabcd',
    evidenceRef: 'github-run:1',
  });
  const event = deliveryFailureToUniversalEvent(observed);
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes('secret-value'), false);
  assert.equal(serialized.includes('abc123'), false);
});
