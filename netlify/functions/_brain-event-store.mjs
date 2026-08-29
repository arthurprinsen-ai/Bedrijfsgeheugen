import { getStore } from '@netlify/blobs';

const STORE_NAME = 'brain-events';

function validateEvent(event) {
  if (!event?.eventId || !event?.tenantId || !event?.idempotencyKey) {
    throw new TypeError('Brain event requires eventId, tenantId and idempotencyKey');
  }
}

function keyFor(event) {
  return `${event.tenantId}/${event.eventId}`;
}

export async function persistBrainEvent(event, { status = 'RECEIVED', now = () => new Date().toISOString() } = {}) {
  validateEvent(event);
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const key = keyFor(event);
  const existing = await store.get(key, { type: 'json', consistency: 'strong' });

  if (existing) {
    if (existing.event?.idempotencyKey !== event.idempotencyKey) {
      const error = new Error('Brain event id conflict');
      error.code = 'EVENT_ID_CONFLICT';
      throw error;
    }
    if (existing.status === status) return existing;
    const updated = { ...existing, status, updatedAt: now() };
    await store.setJSON(key, updated);
    return updated;
  }

  const record = {
    event,
    status,
    firstSeenAt: now(),
    updatedAt: now(),
  };
  const { modified } = await store.setJSON(key, record, { onlyIfNew: true });
  if (!modified) {
    const raced = await store.get(key, { type: 'json', consistency: 'strong' });
    if (!raced || raced.event?.idempotencyKey !== event.idempotencyKey) {
      const error = new Error('Brain event persistence conflict');
      error.code = 'EVENT_PERSISTENCE_CONFLICT';
      throw error;
    }
    return raced;
  }
  return record;
}
