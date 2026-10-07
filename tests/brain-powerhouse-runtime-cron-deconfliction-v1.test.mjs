import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync('supabase/migrations/20261007055200_powerhouse_runtime_cron_deconfliction_v1.sql','utf8');

test('runtime cron deconfliction preserves canonical owners',()=>{
  assert.match(migration,/powerhouse-execution-resilience-watchdog-v1/);
  assert.match(migration,/powerhouse-one-commercial-heartbeat-v1/);
  assert.doesNotMatch(migration,/cron\.unschedule\(/);
  assert.doesNotMatch(migration,/active\s*=>\s*false/);
});

test('systematic cron collisions are removed without material cadence loss',()=>{
  assert.match(migration,/powerhouse-reconciliation-worker-v2[\s\S]*59 seconds/);
  assert.match(migration,/powerhouse-data-spine-watchdog-v1[\s\S]*4,14,24,34,44,54 \* \* \* \*/);
  assert.match(migration,/powerhouse-revenue-attribution-snapshot-v1[\s\S]*9,24,39,54 \* \* \* \*/);
  assert.match(migration,/CRON_SCHEDULE_READBACK_FAILED/);
});

test('commercial heartbeat remains a direct canonical owner',()=>{
  assert.match(migration,/command ilike '%powerhouse_commercial_heartbeat_v1%'/);
  assert.doesNotMatch(migration,/alter_job[\s\S]*powerhouse-one-commercial-heartbeat-v1/);
});
