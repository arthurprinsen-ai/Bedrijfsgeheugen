import { assertExpectedVersion } from '../events/event-store.mjs';
import { createEvent, EVENT_TYPES } from '../contracts/event.mjs';

export function createCommand(input) {
  for (const field of ['commandId','tenantId','actorId','type','objectId','resourceType','action','expectedVersion','reason']) {
    if (input?.[field] == null || input[field] === '') throw new TypeError(`${field} is required`);
  }
  return Object.freeze({ ...input, payload:Object.freeze({ ...(input.payload ?? {}) }) });
}

export async function authorizeAndPlanCommand({ command, currentVersion, authorize, now = () => new Date().toISOString() }) {
  if (typeof authorize !== 'function') throw new TypeError('authorize function is required');
  assertExpectedVersion({ currentVersion, expectedVersion:command.expectedVersion });
  const policy = await authorize({
    tenantId:command.tenantId, subjectId:command.actorId, action:command.action,
    resourceType:command.resourceType, resourceId:command.objectId,
    purpose:command.purpose ?? null, dataClass:command.dataClass ?? null,
  });
  if (policy?.decision !== 'ALLOW') {
    const error = new Error(`command denied: ${policy?.decision ?? 'UNKNOWN'}`);
    error.code = policy?.decision === 'REQUIRE_APPROVAL' ? 'APPROVAL_REQUIRED' : 'COMMAND_DENIED';
    throw error;
  }
  const event = createEvent({
    eventId:`EV-${command.commandId}`, eventType:command.eventType ?? EVENT_TYPES.OBJECT_UPDATED,
    tenantId:command.tenantId, objectId:command.objectId, actorId:command.actorId,
    timestamp:now(), reason:command.reason, correlationId:command.correlationId ?? command.commandId,
    causationId:command.causationId ?? null, schemaVersion:1, idempotencyKey:command.commandId,
    beforeRef:`${command.objectId}@v${currentVersion}`, afterRef:`${command.objectId}@v${currentVersion+1}`,
    risk:command.risk ?? 'Unknown',
  });
  return Object.freeze({ command, policy, event, nextVersion:currentVersion+1 });
}
