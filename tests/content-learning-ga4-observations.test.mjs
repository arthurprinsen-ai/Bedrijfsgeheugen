import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGa4Row, rowsToCsv } from '../lib/content-learning/ga4-observations.mjs';

test('normalizes GA4 string metrics and produces a stable idempotency key', () => {
  const row = normalizeGa4Row({
    date: '20260909',
    pagePathPlusQueryString: '/frisse-blik?utm_campaign=li-001',
    sessionCampaignName: 'li-001',
    sessions: '12',
    activeUsers: '9',
    eventCount: '27',
  }, { observedAt: '2026-09-10T04:00:00.000Z' });
  assert.equal(row.campaign_key, 'li-001');
  assert.equal(row.sessions, 12);
  assert.equal(row.active_users, 9);
  assert.equal(row.event_count, 27);
  assert.match(row.idempotency_key, /^ga4:/);
  assert.equal(row.idempotency_key, normalizeGa4Row({
    date: '20260909', pagePathPlusQueryString: '/frisse-blik?utm_campaign=li-001', sessionCampaignName: 'li-001', sessions: '12', activeUsers: '9', eventCount: '27',
  }, { observedAt: '2026-09-10T04:00:00.000Z' }).idempotency_key);
});

test('keeps empty campaign explicit and emits valid CSV escaping', () => {
  const row = normalizeGa4Row({ date: '20260909', pagePathPlusQueryString: '/blog/a,b', sessionCampaignName: '', sessions: '', activeUsers: '2', eventCount: '3' });
  assert.equal(row.campaign_key, null);
  assert.equal(row.sessions, 0);
  const csv = rowsToCsv([row]);
  assert.match(csv, /"\/blog\/a,b"/);
});
