import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvent, EVENT_TYPES } from '../platform/contracts/event.mjs';

test('material event is immutable, tenant scoped and traceable', () => {
  const event = createEvent({
    eventId: 'EVT-1', eventType: EVENT_TYPES.OBJECT_UPDATED,
    tenantId: 'TENANT-DEMO', objectId: 'GOAL-1', actorId: 'USER-1',
    timestamp: '2026-08-29T10:00:00Z', reason: 'target updated',
    correlationId: 'CORR-1', causationId: 'CMD-1', schemaVersion: 1,
    beforeVersion: 1, afterVersion: 2,
  });
  assert.equal(Object.isFrozen(event), true);
  assert.equal(event.tenantId, 'TENANT-DEMO');
});

test('event rejects missing correlation and schema version', () => {
  assert.throws(() => createEvent({
    eventId: 'EVT-2', eventType: EVENT_TYPES.STATUS_CHANGED,
    tenantId: 'TENANT-DEMO', objectId: 'CHG-1', actorId: 'AGENT-QA',
    timestamp: '2026-08-29T10:00:00Z', reason: 'verified',
  }), /correlationId|schemaVersion/i);
});

test('event idempotency key is deterministic when supplied', () => {
  const input = {
    eventId: 'EVT-3', eventType: EVENT_TYPES.RELATIONSHIP_CHANGED,
    tenantId: 'TENANT-DEMO', objectId: 'REL-1', actorId: 'SYSTEM',
    timestamp: '2026-08-29T10:00:00Z', reason: 'sync', correlationId: 'CORR-2',
    causationId: 'SYNC-1', schemaVersion: 1, idempotencyKey: 'notion:rel-1:v4',
  };
  assert.equal(createEvent(input).idempotencyKey, 'notion:rel-1:v4');
});
