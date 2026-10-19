import test from 'node:test';
import assert from 'node:assert/strict';
import {amsterdamScheduledFor, linkedinDispatchReadiness} from '../supabase/functions/_shared/social-publication-schedule.mjs';

test('Amsterdam publication hour follows daylight saving changes', () => {
  assert.equal(amsterdamScheduledFor('2026-10-24', 13), '2026-10-24T13:00:00+02:00');
  assert.equal(amsterdamScheduledFor('2026-10-26', 13), '2026-10-26T13:00:00+01:00');
  assert.equal(amsterdamScheduledFor('2026-03-28', 13), '2026-03-28T13:00:00+01:00');
  assert.equal(amsterdamScheduledFor('2026-03-30', 13), '2026-03-30T13:00:00+02:00');
});

test('never dispatch a LinkedIn post before its recorded schedule', () => {
  const due='2026-10-20T13:00:00+02:00';
  assert.equal(linkedinDispatchReadiness('linkedin_company',due,Date.parse('2026-10-20T09:00:00Z')).status,'not_due');
  assert.equal(linkedinDispatchReadiness('linkedin_company',due,Date.parse('2026-10-20T11:00:00Z')).status,'due');
  assert.equal(linkedinDispatchReadiness('linkedin_personal',due,Date.parse('2026-10-20T10:59:59Z')).status,'not_due');
});

test('missing or invalid schedule is fail-closed for LinkedIn and leaves Instagram behavior intact', () => {
  assert.equal(linkedinDispatchReadiness('linkedin_company','').status,'invalid_schedule');
  assert.equal(linkedinDispatchReadiness('linkedin_personal','not-a-date').status,'invalid_schedule');
  assert.equal(linkedinDispatchReadiness('instagram_company','').status,'not_applicable');
  assert.throws(()=>amsterdamScheduledFor('2026-02-30',13),/SOCIAL_SCHEDULE_INVALID/);
});
