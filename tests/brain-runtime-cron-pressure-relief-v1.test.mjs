import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20261007055200_powerhouse_runtime_cron_pressure_relief_v1.sql';
const liveBaselinePath='supabase/migrations/20261007055115_consolidate_recovery_cron_and_bound_history_retention.sql';

test('runtime maintenance consolidates every-minute watchdog and reconciliation owners', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/create or replace function public\.powerhouse_runtime_maintenance_tick_v1/i);
  assert.match(sql,/pg_try_advisory_xact_lock/i);
  assert.match(sql,/powerhouse_execution_resilience_watchdog_v1\(\)/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_runtime_maintenance_tick_v1\(timestamptz\)[\s\S]*from public, anon, authenticated/i);
  assert.match(sql,/powerhouse_reconciliation_worker_v2\(\)/i);
  assert.match(sql,/extract\(minute from p_now\)::int % 5\) <> 0/i);
  assert.match(sql,/powerhouse-execution-resilience-watchdog-v1/i);
  assert.match(sql,/powerhouse-reconciliation-worker-v2/i);
  assert.match(sql,/powerhouse-runtime-maintenance-v1/i);
  assert.match(sql,/'\* \* \* \* \*'/);
});

test('commercial heartbeat owner is not altered by runtime maintenance migration', async()=>{
  const sql=await readFile(path,'utf8');
  assert.doesNotMatch(sql,/cron\.unschedule\([^)]*powerhouse-one-commercial-heartbeat-v1/i);
  assert.doesNotMatch(sql,/cron\.alter_job\([^)]*powerhouse-one-commercial-heartbeat-v1/i);
  assert.match(sql,/commercial_heartbeat_slot/);
});


test('successor retires the live temporary recovery owner and preserves bounded history retention', async()=>{
  const sql=await readFile(path,'utf8');
  const baseline=await readFile(liveBaselinePath,'utf8');
  assert.match(baseline,/powerhouse-recovery-control-plane-v1/i);
  assert.match(baseline,/powerhouse-cron-history-retention-v1/i);
  assert.match(baseline,/20261007055115|Live recovery consolidation/i);
  assert.match(sql,/powerhouse-recovery-control-plane-v1/i);
  assert.match(sql,/powerhouse-runtime-maintenance-v1/i);
});
