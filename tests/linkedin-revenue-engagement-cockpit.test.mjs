import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtimePath = new URL('../platform/linkedin-revenue-cockpit.mjs', import.meta.url);
const migrationPath = new URL('../supabase/migrations/20260912181000_linkedin_engagement_to_cockpit.sql', import.meta.url);

async function loadRuntime() {
  return import(runtimePath.href);
}

test('engagement strength distinguishes passive likes from commercial intent', async () => {
  const { scoreEngagementSignal } = await loadRuntime();
  assert.equal(scoreEngagementSignal({ type: 'like', count: 1 }), 4);
  assert.equal(scoreEngagementSignal({ type: 'comment', count: 1 }), 18);
  assert.equal(scoreEngagementSignal({ type: 'repost', count: 1 }), 28);
  assert.equal(scoreEngagementSignal({ type: 'dm', count: 1 }), 40);
  assert.ok(scoreEngagementSignal({ type: 'comment', count: 3 }) > scoreEngagementSignal({ type: 'comment', count: 1 }));
});

test('next action never turns a single like into an unsolicited DM', async () => {
  const { recommendEngagementAction } = await loadRuntime();
  assert.equal(recommendEngagementAction({ type: 'like', count: 1 }), 'observe');
  assert.equal(recommendEngagementAction({ type: 'comment', count: 1 }), 'reply_public');
  assert.equal(recommendEngagementAction({ type: 'repost', count: 1 }), 'review_profile');
  assert.equal(recommendEngagementAction({ type: 'dm', count: 1 }), 'reply_dm');
  assert.equal(recommendEngagementAction({ type: 'comment', count: 2, isConnection: true, commercialFit: 0.9 }), 'review_dm');
});

test('database contract ingests actor engagement idempotently into existing cockpit layers', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'LinkedIn engagement migration must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create table if not exists public\.linkedin_engagement_events/i);
  assert.match(sql, /event_key text not null unique/i);
  assert.match(sql, /create or replace function public\.bg_linkedin_engagement_ingest/i);
  assert.match(sql, /bg_connecties/i);
  assert.match(sql, /powerhouse_sales_actions/i);
  assert.match(sql, /engagement_type/i);
  assert.match(sql, /actor_linkedin_url/i);
  assert.match(sql, /on conflict \(event_key\) do nothing/i);
  assert.match(sql, /revoke all on public\.linkedin_engagement_events from anon, authenticated/i);
});
