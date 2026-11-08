import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../supabase/migrations/', import.meta.url);
const file = readdirSync(dir).find(name => name.endsWith('_snapshot_cron_statement_timeout_v1.sql'));
assert.ok(file, 'migration file not found');
const sql = readFileSync(new URL(file, dir), 'utf8');

test('migration changes only the cron command of the snapshot job and is a safe no-op without cron', () => {
  assert.ok(sql.includes("jobname = 'powerhouse-revenue-intelligence-snapshot-15m'"));
  assert.ok(sql.includes('cron.alter_job('));
  assert.ok(sql.includes("to_regclass('cron.job') is null"));
  assert.ok(sql.includes('if v_id is null then'));
});

test('statement timeout is armed before the DO statement and keeps the advisory lock and both functions', () => {
  assert.ok(sql.includes("set local statement_timeout = '240s';"));
  assert.ok(sql.includes('pg_try_advisory_xact_lock(hashtextextended(\'powerhouse-revenue-intelligence-snapshot\',0))'));
  assert.ok(sql.includes('powerhouse_ensure_commercial_progression_forecasts_v1'));
  assert.ok(sql.includes('powerhouse_refresh_revenue_intelligence_snapshot_v1()'));
});

test('migration does not touch functions, tables or grants', () => {
  assert.equal(/create\s+(or\s+replace\s+)?function|alter\s+table|drop\s+|grant\s+|revoke\s+/i.test(sql), false);
});
