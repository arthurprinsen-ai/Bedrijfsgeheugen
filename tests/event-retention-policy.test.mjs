import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRetention, sanitizeEvidence } from '../tools/event-retention-policy.mjs';

function event(overrides = {}) {
  return {
    event_id: 'evt',
    event_type: 'heartbeat',
    severity: 'info',
    payload_class: 'telemetry',
    privacy_class: 'internal',
    status: 'OBSERVED',
    ...overrides,
  };
}

test('heartbeat/debug telemetry is tier 0 with 7 day raw retention', () => {
  const result = classifyRetention(event());
  assert.equal(result.retentionTier, 0);
  assert.equal(result.rawRetentionDays, 7);
  assert.equal(result.durable, false);
});

test('warnings retries and data-quality anomalies are tier 1 with 30 day raw retention', () => {
  for (const sample of [
    event({ event_type: 'warning', severity: 'warning', payload_class: 'operational' }),
    event({ event_type: 'retry', severity: 'warning', payload_class: 'operational' }),
    event({ event_type: 'data-quality-anomaly', severity: 'warning', payload_class: 'operational' }),
  ]) {
    const result = classifyRetention(sample);
    assert.equal(result.retentionTier, 1);
    assert.equal(result.rawRetentionDays, 30);
    assert.equal(result.durable, false);
  }
});

test('material incidents recoveries releases and business outcomes are tier 2 with 180 day raw retention', () => {
  for (const type of ['incident', 'recovery', 'release', 'business-outcome']) {
    const result = classifyRetention(event({ event_type: type, severity: type === 'incident' ? 'error' : 'info', payload_class: 'evidence' }));
    assert.equal(result.retentionTier, 2);
    assert.equal(result.rawRetentionDays, 180);
  }
});

test('causal learning and prevention/regression knowledge is permanent tier 3', () => {
  for (const type of ['root-cause', 'proven-fix', 'prevention-rule', 'regression-contract', 'durable-learning']) {
    const result = classifyRetention(event({ event_type: type, payload_class: 'learning' }));
    assert.equal(result.retentionTier, 3);
    assert.equal(result.rawRetentionDays, null);
    assert.equal(result.durable, true);
  }
});

test('secret-bearing evidence is redacted and classified restricted', () => {
  const sanitized = sanitizeEvidence({
    authorization: 'Bearer abc',
    api_key: 'xyz',
    nested: { password: 'pw', safe: 'ok' },
  });
  const serialized = JSON.stringify(sanitized);
  assert.equal(serialized.includes('Bearer abc'), false);
  assert.equal(serialized.includes('xyz'), false);
  assert.equal(serialized.includes('pw'), false);
  assert.equal(sanitized.nested.safe, 'ok');
  const result = classifyRetention(event({ privacy_class: 'restricted', event_type: 'incident', severity: 'error' }));
  assert.equal(result.privacyClass, 'restricted');
  assert.ok(result.rawRetentionDays <= 30);
});
