import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFailureLearningEvent, evaluateFailureLearningReadiness } from '../tools/universal-failure-learning.mjs';

const base = {
  event_id: 'failure-1',
  source_system: 'github',
  producer_id: 'unified-brain-delivery',
  component: 'delivery',
  error_code: 'UNCLASSIFIED_PATH',
  message: 'unclassified delivery path: tests/event-retention-expiry.test.mjs',
  fingerprint: 'brain|delivery-classifier|new-runtime-path-unclassified',
  evidence_refs: ['github-run:33516203498'],
};

test('observed failure is not proven learning without root cause fix prevention and regression evidence', () => {
  const result = evaluateFailureLearningReadiness(base);
  assert.equal(result.proven, false);
  assert.ok(result.missing.includes('rootCause'));
  assert.ok(result.missing.includes('fix'));
});

test('proven failure learning preserves the full reusable engineering lesson', () => {
  const event = buildFailureLearningEvent({
    ...base,
    rootCause: 'The new event-retention test family was not registered in the delivery classifier.',
    failedApproach: 'Registering individual filenames creates recurring classifier gaps.',
    fix: 'Classify tools/tests event-retention by prefix and execute the family in its dedicated workflow.',
    preventionRule: 'CLASSIFY_AND_EXECUTE_RUNTIME_TEST_FAMILIES_BY_PREFIX',
    regressionContract: 'tests/universal-failure-learning.test.mjs + tests/event-retention-expiry.test.mjs',
    outcomeEvidence: 'GitHub BRAIN delivery and Universal Event Retention Contract green on the exact head SHA.',
  }, '2026-09-01T14:00:00.000Z');
  assert.equal(event.status, 'PROVEN');
  assert.equal(event.retention_tier, 3);
  assert.equal(event.durable_learning_required, true);
  assert.equal(event.payload.rootCause.includes('not registered'), true);
  assert.equal(event.payload.preventionRule, 'CLASSIFY_AND_EXECUTE_RUNTIME_TEST_FAMILIES_BY_PREFIX');
});

test('future app failures use the same canonical failure envelope', () => {
  const event = buildFailureLearningEvent({
    ...base,
    event_id: 'future-app-1',
    source_system: 'future-provider',
    producer_id: 'future-integration',
    rootCause: 'Schema changed.',
    failedApproach: 'Assumed schema.',
    fix: 'Read live schema before write.',
    preventionRule: 'READ_LIVE_SCHEMA_BEFORE_EVIDENCE_WRITE',
    regressionContract: 'provider contract canary',
    outcomeEvidence: 'readback verified',
  }, '2026-09-01T14:00:00.000Z');
  assert.equal(event.source_system, 'future-provider');
  assert.equal(event.producer_id, 'future-integration');
  assert.equal(event.event_type, 'durable-learning');
});
