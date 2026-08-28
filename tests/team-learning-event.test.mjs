import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLearningEvent } from '../scripts/team-memory/validate-event.mjs';

const base = {
  type: 'ERROR', source: 'github', component: 'preview-build',
  fingerprint: 'github|preview-build|build-error', severity: 'error',
  owner_agent: '09', action: 'repair preview build',
  verification: 'build and preview green', rollback: 'restore last-known-good'
};

test('accepts a valid error event', () => {
  assert.deepEqual(validateLearningEvent(base), { valid: true, errors: [] });
});

test('rejects unsupported event types', () => {
  const r = validateLearningEvent({ ...base, type: 'RANDOM' });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /type/i);
});

test('opportunity requires scores confidence owner metric action verification and rollback', () => {
  const r = validateLearningEvent({ ...base, type: 'OPPORTUNITY' });
  assert.equal(r.valid, false);
  assert.match(r.errors.join(' '), /evidence_score/);
  assert.match(r.errors.join(' '), /business_impact_score/);
  assert.match(r.errors.join(' '), /confidence/);
  assert.match(r.errors.join(' '), /metric/);
});

test('accepts bounded opportunity scores', () => {
  const r = validateLearningEvent({
    ...base, type: 'OPPORTUNITY', source: 'search',
    evidence_score: 82, novelty_score: 70, business_impact_score: 90,
    confidence: 0.8, metric: 'organic_ctr', opportunity_rationale: 'high impressions low CTR'
  });
  assert.equal(r.valid, true, r.errors.join('; '));
});

test('rejects scores outside their bounds', () => {
  const r = validateLearningEvent({
    ...base, type: 'OPPORTUNITY', evidence_score: 101, novelty_score: -1,
    business_impact_score: 90, confidence: 2, metric: 'ctr'
  });
  assert.equal(r.valid, false);
});
