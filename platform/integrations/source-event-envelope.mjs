import { createHash } from 'node:crypto';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

export function createSourceEventEnvelope({ payload, explicitIdempotencyKey = '', occurredAt = new Date().toISOString() }) {
  if (!payload || typeof payload !== 'object') throw new TypeError('payload is required');
  const explicit = String(explicitIdempotencyKey || '').trim();
  const idempotencyKey = explicit ? `client:${digest(explicit)}` : `monitor:${digest(payload)}`;
  const eventHash = digest({ source:'website-monitor', idempotencyKey }).slice(0, 24);

  return Object.freeze({
    eventId:`EVT-MONITOR-${eventHash}`,
    eventType:'SourceSynced',
    tenantId:'PUBLIC',
    objectType:'DigitalisationMonitorSubmission',
    truthClass:'SourceFact',
    verification:'Unverified',
    idempotencyKey,
    occurredAt,
    schemaVersion:1,
    provenance:Object.freeze({
      sourceType:'WebsiteForm',
      sourceRef:'/api/monitor',
      sourceSystem:'bedrijfsgeheugen.nl',
    }),
  });
}
