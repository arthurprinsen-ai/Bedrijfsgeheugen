import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261020124500_p0_4215_canonical_cron_pressure_dephase.sql', import.meta.url), 'utf8');

test('move observed revenue snapshot away from the competing hourly assurance at minute 52', () => {
  assert.match(sql, /'powerhouse-revenue-intelligence-snapshot-15m', '52 \* \* \* \*', '55 \* \* \* \*'/);
  assert.match(sql, /powerhouse_refresh_revenue_intelligence_snapshot_v1/);
  assert.match(sql, /powerhouse_ensure_commercial_progression_forecasts_v1/);
});

test('preserve visual assurance hourly while dephasing from commercial minute 12', () => {
  assert.match(sql, /'powerhouse-portal-visual-assurance-sync-v1', '12 \* \* \* \*', '45 \* \* \* \*'/);
  assert.match(sql, /powerhouse-visual-assurance-sync/);
});

test('only reconcile known existing active cron owners, never stop commercial or runtime scheduler', () => {
  assert.match(sql, /WHERE j\.jobname=r\.jobname AND j\.active=true/);
  assert.match(sql, /cron\.alter_job\(job_id=>v_id,schedule=>r\.new_schedule\)/);
  assert.doesNotMatch(sql, /\bcron\.(?:schedule|unschedule)\s*\(/i);
  assert.doesNotMatch(sql, /\b(?:UPDATE|DELETE|TRUNCATE|DROP|REVOKE)\b/i);
  assert.doesNotMatch(sql, /cron\.alter_job\([^)]*command\s*=>/i);
});

test('fail closed on schedule/command drift and support idempotent readback', () => {
  assert.match(sql, /v_schedule NOT IN \(r\.old_schedule,r\.new_schedule\)/);
  assert.match(sql, /P0_4215_CRON_COMMAND_DRIFT/);
  assert.match(sql, /IF v_schedule = r\.old_schedule THEN/);
  assert.match(sql, /P0_4215_OWNER_ABSENT_PREVIEW/);
});
