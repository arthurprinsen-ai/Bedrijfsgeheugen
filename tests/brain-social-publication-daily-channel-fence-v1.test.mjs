import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'supabase/migrations/20260922080500_social_publication_daily_channel_fence_v1.sql';
const migration = fs.readFileSync(file, 'utf8');

test('daily social publication fence is serialized per date and channel', () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /powerhouse-social-publish\|/);
  assert.match(migration, /run_date = new\.run_date/);
  assert.match(migration, /channel = new\.channel/);
});

test('only expired unconsumed capability may be reclaimed', () => {
  assert.match(migration, /consumed_at is null/);
  assert.match(migration, /expires_at <= now\(\)/);
  assert.match(migration, /EXPIRED_UNCONSUMED_RECLAIM_DAILY_CHANNEL_FENCE_V1/);
  assert.match(migration, /DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED/);
});

test('database enforces one active capability per day and channel', () => {
  assert.match(
    migration,
    /create unique index if not exists powerhouse_social_publish_capabilities_v1_one_active_day_channel_uidx/
  );
  assert.match(migration, /on public\.powerhouse_social_publish_capabilities_v1\(run_date, channel\)/);
  assert.match(migration, /where revoked_at is null/);
});

test('historical duplicate active capabilities are contained before the unique index', () => {
  const cleanup = migration.indexOf('DUPLICATE_ACTIVE_CAPABILITY_CLEANUP_DAILY_CHANNEL_FENCE_V1');
  const uniqueIndex = migration.indexOf('powerhouse_social_publish_capabilities_v1_one_active_day_channel_uidx');
  assert.ok(cleanup > 0);
  assert.ok(uniqueIndex > cleanup);
});
