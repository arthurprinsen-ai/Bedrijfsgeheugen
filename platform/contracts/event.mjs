export const EVENT_TYPES = Object.freeze({
  OBJECT_CREATED: 'OBJECT_CREATED', OBJECT_UPDATED: 'OBJECT_UPDATED', STATUS_CHANGED: 'STATUS_CHANGED',
  RELATIONSHIP_CHANGED: 'RELATIONSHIP_CHANGED', SOURCE_SYNCED: 'SOURCE_SYNCED', SOURCE_CONFLICT: 'SOURCE_CONFLICT',
  FINDING_CREATED: 'FINDING_CREATED', RECOMMENDATION_CREATED: 'RECOMMENDATION_CREATED', DECISION_RECORDED: 'DECISION_RECORDED',
  ACTION_CHANGED: 'ACTION_CHANGED', CHANGE_PROPOSED: 'CHANGE_PROPOSED', CHANGE_ACTIVATED: 'CHANGE_ACTIVATED',
  VERIFICATION_COMPLETED: 'VERIFICATION_COMPLETED', IMPACT_VERIFIED: 'IMPACT_VERIFIED', LEARNING_RECORDED: 'LEARNING_RECORDED',
  ACCESS_CHANGED: 'ACCESS_CHANGED', AI_PROCESSING_REQUESTED: 'AI_PROCESSING_REQUESTED', AI_PROCESSING_DENIED: 'AI_PROCESSING_DENIED',
});

const types = new Set(Object.values(EVENT_TYPES));
function req(value, name) { if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`); }

export function assertEvent(event) {
  req(event.eventId, 'eventId'); req(event.tenantId, 'tenantId'); req(event.objectId, 'objectId');
  req(event.actorId, 'actorId'); req(event.timestamp, 'timestamp'); req(event.reason, 'reason'); req(event.correlationId, 'correlationId');
  if (!types.has(event.eventType)) throw new TypeError('eventType is invalid');
  if (!Number.isInteger(event.schemaVersion) || event.schemaVersion < 1) throw new TypeError('schemaVersion must be a positive integer');
  return true;
}

export function createEvent(input) {
  const event = {
    eventId: input.eventId, eventType: input.eventType, tenantId: input.tenantId, objectId: input.objectId,
    actorId: input.actorId, source: input.source ?? null, timestamp: input.timestamp, reason: input.reason,
    correlationId: input.correlationId, causationId: input.causationId ?? null, risk: input.risk ?? null,
    schemaVersion: input.schemaVersion, beforeVersion: input.beforeVersion ?? null, afterVersion: input.afterVersion ?? null,
    idempotencyKey: input.idempotencyKey ?? input.eventId,
  };
  assertEvent(event);
  return Object.freeze(event);
}
