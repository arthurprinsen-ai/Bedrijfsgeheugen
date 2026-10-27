import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const aclMigration=readFileSync(new URL('../supabase/migrations/20261025114200_resilience_stage_writer_service_role_acl_parity_v1.sql',import.meta.url),'utf8');

const migration=readFileSync(new URL('../supabase/migrations/20261025114100_resilience_watchdog_owned_stage_receipts_v1.sql',import.meta.url),'utf8');

test('one original watchdog and one existing scheduler; no queue, parallel agent or false revenue',()=>{
  assert.match(migration,/CREATE OR REPLACE FUNCTION public\.powerhouse_execution_resilience_watchdog_v1/);
  assert.match(migration,/cron_jobname='powerhouse-runtime-scheduler-mux-v1'/);
  assert.doesNotMatch(migration,/cron\.schedule|CREATE\s+TABLE|CREATE\s+MATERIALIZED\s+VIEW|CREATE\s+EXTENSION/i);
  assert.match(migration,/operational watchdog only; never provider output or customer revenue/);
});
test('real watchdog writes all eight required stages at exact invocation time, not by synthetic scheduling',()=>{
  assert.match(migration,/v_recovery_scheduled := v_recovery_scheduled \+ 1/);
  assert.match(migration,/foreach v_stage in array array\['input','decision','action','readback','outcome','measurement','learning','guard'\]/);
  assert.match(migration,/public\.powerhouse_record_loop_stage_v1\(/);
  assert.match(migration,/\),p_now\s*\)/);
  assert.match(migration,/'evidence_type','verified_existing_watchdog_execution'/);
  assert.match(migration,/'watchdog_invocation_at',p_now/);
  assert.match(migration,/'watchdog_actual_input','brain_operations \/ execution_resilience original service-only selector'/);
  assert.match(migration,/'decision_outcome',case when v_guard_pass then 'WATCHDOG_GUARD_PASS' else 'RECOVERY_PENDING' end/);
});
test('guard preserves stale-operation truth, selftest suppression and bounded recovery',()=>{
  for(const clause of [
    "o.status in ('PLANNED','DISPATCHED','RESULT_UNKNOWN')",
    "o.evidence ? 'execution_resilience'",
    "fixture_classification",
    "historical_selftest",
    "recovery_required",
    "p_timeout_seconds",
    "v_stale_unreconciled=0"
  ]) assert.ok(migration.includes(clause),`missing source guard: ${clause}`);
  assert.match(migration,/v_guard_pass := v_stale_unreconciled=0;/);
  assert.match(migration,/'pass',case when v_stage='guard' then v_guard_pass else null end/);
  assert.match(migration,/'action_kind',case/);
  assert.match(migration,/RECOVERY_SCHEDULED/);
});
test('same original 5-minute task cadence, strict ownership and atomic fail-closed migration',()=>{
  assert.match(migration,/expected_cadence_minutes=5/);
  assert.match(migration,/expected_cadence_minutes IN \(2,5\)/);
  assert.match(migration,/watchdog_task_cadence_minutes',5/);
  assert.match(migration,/RESILIENCE_CANONICAL_SOURCE_MISSING/);
  assert.match(migration,/RESILIENCE_ASSURANCE_OWNER_DRIFT/);
  assert.match(migration,/RESILIENCE_CADENCE_PARITY_NOT_PROVEN/);
  assert.match(migration,/BEGIN;/);
  assert.match(migration,/COMMIT;/);
  assert.doesNotMatch(migration,/GRANT\s+ALL|GRANT\s+EXECUTE\s+TO\s+(PUBLIC|anon|authenticated)/i);
});

test('clean-room preview and current production both converge to the same actual mux authority',()=>{
  assert.match(migration,/RESILIENCE_CANONICAL_MUX_TASK_NOT_PROVEN/);
  assert.match(migration,/position\('execution-resilience-watchdog' in pg_get_functiondef/);
  assert.match(migration,/position\('if \(m % 5\) = 1' in pg_get_functiondef/);
  assert.match(migration,/powerhouse-execution-resilience-watchdog-v1' AND expected_cadence_minutes=1/);
  assert.match(migration,/powerhouse-runtime-scheduler-mux-v1' AND expected_cadence_minutes IN \(2,5\)/);
  assert.match(migration,/cron_jobname='powerhouse-runtime-scheduler-mux-v1'/);
  assert.match(migration,/RESILIENCE_ASSURANCE_OWNER_DRIFT/);
});

test('preview and production have exactly the same service-only receipt writer boundary',()=>{
  assert.match(aclMigration,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_record_loop_stage_v1/);
  assert.match(aclMigration,/FROM PUBLIC, anon, authenticated/);
  assert.match(aclMigration,/GRANT EXECUTE ON FUNCTION public\.powerhouse_record_loop_stage_v1/);
  assert.match(aclMigration,/TO service_role/);
  assert.match(aclMigration,/has_function_privilege\('service_role',v_oid,'EXECUTE'\)/);
  assert.match(aclMigration,/has_function_privilege\('anon',v_oid,'EXECUTE'\)/);
  assert.match(aclMigration,/has_function_privilege\('authenticated',v_oid,'EXECUTE'\)/);
  assert.match(aclMigration,/RESILIENCE_STAGE_WRITER_ROLE_PARITY_FAILED/);
});
