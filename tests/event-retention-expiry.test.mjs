import test from 'node:test';
import assert from 'node:assert/strict';
import { decideRawExpiry } from '../tools/event-retention-expiry.mjs';

const now = '2026-09-01T14:00:00.000Z';

test('expires only raw payload for overdue tier 0-2 evidence', () => {
  const result = decideRawExpiry({
    page_id: 'page-1',
    retention_tier: 1,
    raw_retain_until: '2026-09-01T13:59:59.000Z',
    event_payload_json: '{"debug":true}',
    event_fingerprint: 'fp-1',
    payload_hash: 'hash-1',
    evidence_refs: '["ref-1"]',
    graph_object_key: 'event:1',
  }, now);
  assert.equal(result.expire, true);
  assert.deepEqual(result.clear_fields, ['Event Payload JSON']);
  assert.equal(result.preserve.event_fingerprint, 'fp-1');
  assert.equal(result.preserve.payload_hash, 'hash-1');
  assert.equal(result.preserve.evidence_refs, '["ref-1"]');
  assert.equal(result.preserve.graph_object_key, 'event:1');
});

test('never expires tier 3 durable intelligence even when a raw deadline is malformed or old', () => {
  const result = decideRawExpiry({
    page_id: 'page-2',
    retention_tier: 3,
    raw_retain_until: '2020-01-01T00:00:00.000Z',
    event_payload_json: '{"learning":"keep"}',
  }, now);
  assert.equal(result.expire, false);
  assert.equal(result.reason, 'TIER3_PERMANENT');
});

test('does nothing when raw payload is already empty or deadline is in the future', () => {
  assert.equal(decideRawExpiry({ retention_tier: 1, raw_retain_until: '2026-09-02T00:00:00.000Z', event_payload_json: 'x' }, now).expire, false);
  assert.equal(decideRawExpiry({ retention_tier: 1, raw_retain_until: '2026-08-01T00:00:00.000Z', event_payload_json: '' }, now).expire, false);
});
