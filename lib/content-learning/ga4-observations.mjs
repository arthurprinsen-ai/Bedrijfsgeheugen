import { createHash } from 'node:crypto';

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function normalizeGa4Row(row = {}, { observedAt = new Date().toISOString() } = {}) {
  const date = text(row.date);
  const pagePath = text(row.pagePathPlusQueryString ?? row.pagePath);
  const campaignKey = text(row.sessionCampaignName ?? row.campaign);
  const identity = JSON.stringify({ date, pagePath, campaignKey });
  return {
    event_id: `ga4:${sha256(identity).slice(0, 24)}`,
    idempotency_key: `ga4:${sha256(identity)}`,
    observed_at: observedAt,
    date,
    page_path: pagePath,
    campaign_key: campaignKey,
    sessions: number(row.sessions),
    active_users: number(row.activeUsers ?? row.active_users),
    event_count: number(row.eventCount ?? row.event_count),
  };
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const string = String(value);
  return /[",\n\r]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

export function rowsToCsv(rows = []) {
  const columns = ['event_id', 'idempotency_key', 'observed_at', 'date', 'page_path', 'campaign_key', 'sessions', 'active_users', 'event_count'];
  return [columns.join(','), ...rows.map(row => columns.map(column => csvCell(row[column])).join(','))].join('\n');
}
