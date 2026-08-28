import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintEvent, dedupeKey } from '../scripts/team-memory/fingerprint.mjs';

test('same SEO opportunity dedupes despite timestamp and source URL changes', () => {
  const a = { type:'OPPORTUNITY', source:'search', component:'seo', query:'kennis borgen bedrijf', route:'/kennis', opportunity_key:'low-ctr', timestamp:'2026-08-28T10:00:00Z', source_url:'https://a.example' };
  const b = { ...a, timestamp:'2026-08-28T11:00:00Z', source_url:'https://b.example' };
  assert.equal(fingerprintEvent(a), fingerprintEvent(b));
});

test('different route creates a different semantic fingerprint', () => {
  const a = { type:'OPPORTUNITY', source:'search', component:'seo', query:'kennis borgen bedrijf', route:'/kennis', opportunity_key:'low-ctr' };
  const b = { ...a, route:'/prijzen' };
  assert.notEqual(fingerprintEvent(a), fingerprintEvent(b));
});

test('same error class and component dedupes', () => {
  const a = { type:'ERROR', source:'make', component:'BG156', error_class:'RATE_LIMIT_429', execution_id:'one' };
  const b = { ...a, execution_id:'two' };
  assert.equal(fingerprintEvent(a), fingerprintEvent(b));
});

test('state hash separates experiment states without changing semantic fingerprint', () => {
  const event = { type:'OPPORTUNITY', source:'web', component:'hero', route:'/', opportunity_key:'cta-conversion' };
  assert.equal(fingerprintEvent({ ...event, baseline: 0.02 }), fingerprintEvent({ ...event, baseline: 0.03 }));
  assert.notEqual(dedupeKey(event, { baseline:0.02 }), dedupeKey(event, { baseline:0.03 }));
});
