import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceEventEnvelope } from '../platform/integrations/source-event-envelope.mjs';

const payload = {
  grootte:'10-25', sector:'bouw', provincie:'Overijssel', uren:8, systemen:5,
  pakket:'mix', uitval:'soms', ai:'proef', abonnement:'ja', aiact:'onbekend',
  rapport:false, email:'', bron:'linkedin', utm_source:'linkedin', utm_medium:'social',
  utm_campaign:'campagne', utm_content:'post', referrer:'', landing_url:'https://www.bedrijfsgeheugen.nl/monitor',
  content_id:'c1', platform_post_id:'p1', attribution_key:'monitor|linkedin|social|campagne|post|c1|p1',
};

test('monitor source-event envelope is deterministic and provenance-complete', () => {
  const a = createSourceEventEnvelope({ payload, occurredAt:'2026-08-29T12:00:00.000Z' });
  const b = createSourceEventEnvelope({ payload, occurredAt:'2026-08-29T13:00:00.000Z' });
  assert.equal(a.eventId, b.eventId);
  assert.equal(a.idempotencyKey, b.idempotencyKey);
  assert.equal(a.eventType, 'SourceSynced');
  assert.equal(a.tenantId, 'PUBLIC');
  assert.equal(a.objectType, 'DigitalisationMonitorSubmission');
  assert.equal(a.truthClass, 'SourceFact');
  assert.equal(a.verification, 'Unverified');
  assert.equal(a.provenance.sourceType, 'WebsiteForm');
  assert.equal(a.provenance.sourceRef, '/api/monitor');
  assert.equal(a.schemaVersion, 1);
  assert.equal(a.occurredAt, '2026-08-29T12:00:00.000Z');
  assert.equal(JSON.stringify(a).includes('arthur@'), false);
});

test('explicit idempotency key wins without exposing it as raw event id', () => {
  const a = createSourceEventEnvelope({ payload, explicitIdempotencyKey:'browser-submit-123', occurredAt:'2026-08-29T12:00:00.000Z' });
  const b = createSourceEventEnvelope({ payload:{ ...payload, uren:99 }, explicitIdempotencyKey:'browser-submit-123', occurredAt:'2026-08-29T12:01:00.000Z' });
  assert.equal(a.idempotencyKey, 'browser-submit-123');
  assert.equal(b.idempotencyKey, 'browser-submit-123');
  assert.equal(a.eventId, b.eventId);
  assert.notEqual(a.eventId, 'browser-submit-123');
});
