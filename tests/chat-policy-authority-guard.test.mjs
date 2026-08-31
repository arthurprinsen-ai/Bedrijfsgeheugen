import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const policy = JSON.parse(readFileSync('brain/policies/chat-to-brain-completeness-v1.json', 'utf8'));
const guard = JSON.parse(readFileSync('config/chat-learning-completeness-guard.json', 'utf8'));

test('chat-to-Brain semantics have one canonical policy and one enforcement projection', () => {
  assert.equal(policy.authority?.role, 'CANONICAL_POLICY');
  assert.equal(policy.authority?.semanticAuthority, true);
  assert.equal(policy.authority?.enforcementProjection, 'config/chat-learning-completeness-guard.json');
  assert.equal(guard.authority?.role, 'ENFORCEMENT_PROJECTION');
  assert.equal(guard.authority?.canonicalPolicy, 'brain/policies/chat-to-brain-completeness-v1.json');
  assert.equal(guard.authority?.conflictResolution, 'CANONICAL_POLICY_WINS');
  assert.equal(guard.authority?.mayNotCreateIndependentSemanticPolicy, true);
});
