import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20261020134000_p0_4215_runtime_mux_load_spacing.sql', import.meta.url),
  'utf8'
);
test('runtime P0 change spaces only the existing canonical scheduler job', () => {
  assert.match(sql, /WHERE jobid = 171/);
  assert.match(sql, /powerhouse-runtime-scheduler-mux-v1/);
  assert.match(sql, /1-59\/5,3-59\/5,4-59\/5 \* \* \* \*/);
  assert.match(sql, /1-59\/5,3-59\/5 \* \* \* \*/);
  assert.match(sql, /PERFORM cron\.alter_job\(171, schedule => v_target\)/);
  assert.doesNotMatch(sql, /cron\.(?:unschedule|schedule|schedule_in_database)\s*\(/i);
});
test('migration fails closed on drift and confirms active unchanged', () => {
  assert.match(sql, /v_job\.active IS DISTINCT FROM true/);
  assert.match(sql, /v_job\.schedule IS DISTINCT FROM v_original/);
  assert.match(sql, /SCHEDULER_DRIFT_GUARD_FAILED/);
  assert.match(sql, /SCHEDULER_READBACK_FAILED/);
  assert.match(sql, /AND active IS TRUE AND schedule = v_target/);
  assert.match(sql, /SET LOCAL lock_timeout = '2s'/);
  assert.match(sql, /SET LOCAL statement_timeout = '10s'/);
  assert.doesNotMatch(sql, /\b(?:DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|CREATE\s+EXTENSION|ALTER\s+POLICY|REVOKE)\b/i);
});
