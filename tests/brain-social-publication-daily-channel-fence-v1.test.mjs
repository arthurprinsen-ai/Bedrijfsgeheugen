import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260922094000_social_publication_daily_channel_fence_v1.sql','utf8');

test('daily channel fence serializes publication capability issuance',()=>{
  assert.match(migration,/pg_advisory_xact_lock/);
  assert.match(migration,/run_date = new\.run_date/);
  assert.match(migration,/channel = new\.channel/);
  assert.match(migration,/DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED/);
});

test('daily channel fence only reclaims expired unconsumed claims',()=>{
  assert.match(migration,/consumed_at is null/);
  assert.match(migration,/expires_at <= now\(\)/);
  assert.match(migration,/EXPIRED_UNCONSUMED_RECLAIM_DAILY_CHANNEL_FENCE_V1/);
});

test('daily channel fence has a database uniqueness backstop',()=>{
  assert.match(migration,/create unique index if not exists powerhouse_social_publish_capabilities_v1_one_active_day_channel_uidx/);
  assert.match(migration,/on public\.powerhouse_social_publish_capabilities_v1\(run_date, channel\)/);
  assert.match(migration,/where revoked_at is null/);
});
