import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefinitionRegistry, CORE_DEFINITIONS } from '../platform/contracts/definition-registry.mjs';
import { createEvent, EVENT_TYPES } from '../platform/contracts/event.mjs';
import { createInMemoryEventStore, assertExpectedVersion } from '../platform/events/event-store.mjs';

test('definition registry prevents competing meanings for one key', () => {
  const registry = createDefinitionRegistry(CORE_DEFINITIONS);
  assert.match(registry.get('AIInterpretation').meaning, /not Business Truth/i);
  assert.throws(() => createDefinitionRegistry([
    { key: 'Revenue', meaning: 'one', unit: 'EUR' },
    { key: 'Revenue', meaning: 'two', unit: 'EUR' },
  ]), /duplicate definition/i);
});

test('event store is idempotent and preserves append order', () => {
  const event = createEvent({
    eventId: 'EV-1', eventType: EVENT_TYPES.OBJECT_CREATED, tenantId: 'TENANT-DEMO', objectId: 'GOAL-1', actorId: 'USER-1',
    timestamp: '2026-08-29T10:00:00Z', reason: 'create goal', correlationId: 'CORR-1', schemaVersion: 1, idempotencyKey: 'idem-1',
  });
  const store = createInMemoryEventStore();
  const first = store.append(event);
  const second = store.append(event);
  assert.equal(first, second);
  assert.equal(store.all().length, 1);
  assert.equal(store.byCorrelation('CORR-1').length, 1);
});

test('optimistic version conflicts fail explicitly', () => {
  assert.equal(assertExpectedVersion({ currentVersion: 4, expectedVersion: 4 }), true);
  assert.throws(() => assertExpectedVersion({ currentVersion: 5, expectedVersion: 4 }), error => error.code === 'VERSION_CONFLICT');
});
