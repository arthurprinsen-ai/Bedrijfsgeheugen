import { assertEvent } from '../contracts/event.mjs';

export function createInMemoryEventStore(seed = []) {
  const events = [];
  const byId = new Map();
  const idempotency = new Map();

  function append(event) {
    assertEvent(event);
    if (byId.has(event.eventId)) {
      const existing = byId.get(event.eventId);
      if (existing.idempotencyKey === event.idempotencyKey) return existing;
      throw new Error(`event id conflict: ${event.eventId}`);
    }
    if (idempotency.has(event.idempotencyKey)) return idempotency.get(event.idempotencyKey);
    const frozen = Object.freeze({ ...event });
    events.push(frozen);
    byId.set(frozen.eventId, frozen);
    idempotency.set(frozen.idempotencyKey, frozen);
    return frozen;
  }

  for (const event of seed) append(event);

  return Object.freeze({
    append,
    all() { return Object.freeze([...events]); },
    byObject(objectId) { return Object.freeze(events.filter(event => event.objectId === objectId)); },
    byCorrelation(correlationId) { return Object.freeze(events.filter(event => event.correlationId === correlationId)); },
  });
}

export function assertExpectedVersion({ currentVersion, expectedVersion }) {
  if (currentVersion !== expectedVersion) {
    const error = new Error(`version conflict: expected ${expectedVersion}, current ${currentVersion}`);
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return true;
}
