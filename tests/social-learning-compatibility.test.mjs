import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOutcomeEnvelope } from '../netlify/functions/social-outcome-ingest.mjs';

test('Make-forwarded and direct payloads normalize to same canonical event shape',()=>{
  const direct={eventId:'e1',tenantId:'t1',idempotencyKey:'i1',platform:'linkedin_company',externalPostId:'p1',observedAt:'2026-09-02T10:00:00Z',source:'linkedin',metrics:{impressions:10}};
  const forwarded={body:{result:direct}};
  assert.deepEqual(normalizeOutcomeEnvelope(direct),normalizeOutcomeEnvelope(forwarded));
});
