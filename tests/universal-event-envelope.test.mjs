import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUniversalEvent,
  fingerprintUniversalEvent,
  validateUniversalEvent,
} from '../tools/universal-event-envelope.mjs';

test('normalizes a complete universal event with deterministic identity and fingerprint', () => {
  const input = {
    event_id: 'evt-001',
    occurred_at: '2026-09-01T12:00:00.000Z',
    source_system: 'GitHub',
    producer_id: 'weekblog',
    domain: 'Publication',
    event_type: 'Publish Failure',
    severity: 'error',
    entity_keys: ['blog:rest-api-exact-online-koppelen'],
    correlation_id: 'publish-command-1',
    attribution_root_key: 'seo:rest-api-exact-online-koppelen',
    evidence_refs: ['github-run:33487224772'],
    payload: { reason: 'Invalid username or token' },
    payload_class: 'operational',
    privacy_class: 'internal',
    cost_units: 2,
    status: 'OBSERVED',
  };
  const event = normalizeUniversalEvent(input, '2026-09-01T12:01:00.000Z');
  assert.equal(event.event_id, 'evt-001');
  assert.equal(event.source_system, 'github');
  assert.equal(event.producer_id, 'weekblog');
  assert.equal(event.domain, 'publication');
  assert.equal(event.event_type, 'publish-failure');
  assert.equal(event.ingested_at, '2026-09-01T12:01:00.000Z');
  assert.match(event.payload_hash, /^[a-f0-9]{64}$/);
  assert.match(event.fingerprint, /^universal-event\|publication\|publish-failure\|[a-f0-9]{16}$/);
  assert.deepEqual(validateUniversalEvent(event), { ok: true, errors: [] });
  assert.equal(fingerprintUniversalEvent(event), event.fingerprint);
});

test('rejects events without immutable identity or producer/source/type', () => {
  const result = validateUniversalEvent({ event_id: '', source_system: '', producer_id: '', event_type: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('event_id'));
  assert.ok(result.errors.includes('source_system'));
  assert.ok(result.errors.includes('producer_id'));
  assert.ok(result.errors.includes('event_type'));
});

test('redacts secret values before payload hashing or durable normalization', () => {
  const event = normalizeUniversalEvent({
    event_id: 'evt-secret',
    occurred_at: '2026-09-01T12:00:00.000Z',
    source_system: 'make',
    producer_id: 'BG210',
    domain: 'publication',
    event_type: 'warning',
    severity: 'warning',
    payload: {
      authorization: 'Bearer super-secret-token',
      api_key: 'abc123',
      nested: { password: 'hunter2', safe: 'keep-me' },
    },
    payload_class: 'operational',
    privacy_class: 'sensitive',
    status: 'OBSERVED',
  }, '2026-09-01T12:01:00.000Z');
  const serialized = JSON.stringify(event.payload);
  assert.equal(serialized.includes('super-secret-token'), false);
  assert.equal(serialized.includes('abc123'), false);
  assert.equal(serialized.includes('hunter2'), false);
  assert.equal(event.payload.nested.safe, 'keep-me');
});
