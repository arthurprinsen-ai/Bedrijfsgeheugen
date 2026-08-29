import test from 'node:test';
import assert from 'node:assert/strict';
import { createComplianceLink, createPrivacyAuditEvent, evidenceStatus } from '../platform/policy/compliance.mjs';

test('compliance is modeled as law to requirement to policy to control to evidence', () => {
  const link = createComplianceLink({ law:'EU AI Act', requirement:'Transparency', policy:'AI-TRANS-01', control:'UI_AI_DISCLOSURE', evidence:[{ id:'EV-1', validUntil:'2026-12-01T00:00:00Z' }] });
  assert.equal(link.control, 'UI_AI_DISCLOSURE');
  assert.equal(evidenceStatus(link, '2026-08-29T10:00:00Z').status, 'Current');
});

test('privacy audit records metadata but not raw prompt or business payload', () => {
  const event = createPrivacyAuditEvent({ eventId:'AUD-1', tenantId:'T1', actorId:'U1', action:'AI_PROCESSING_ALLOWED', purpose:'MANAGEMENT_ANALYSIS', dataClasses:['Confidential'], providerModelId:'MODEL-1', policyIds:['AI-ALLOW'], status:'Allowed', timestamp:'2026-08-29T10:00:00Z' });
  assert.equal(event.rawPrompt, null);
  assert.equal(event.rawBusinessPayload, null);
  assert.deepEqual(event.policyIds, ['AI-ALLOW']);
});
