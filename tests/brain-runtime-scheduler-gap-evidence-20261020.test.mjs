import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../supabase/migrations/20261020174500_runtime_scheduler_gap_evidence_ledger.sql', import.meta.url),
  'utf8',
);

test('uses exactly the reachable 36 slots per hour of existing mux #171', () => {
  const due = [...Array(60).keys()].filter((minute) => [1, 3, 4].includes(minute % 5));
  assert.equal(due.length, 36);
  assert.deepEqual(due.slice(0, 6), [1, 3, 4, 6, 8, 9]);
  assert.match(source, /% 5 IN \(1,3,4\)/);
  assert.match(source, /d\.jobid=171/);
});

test('never dispatches a job or automatically replays side effects', () => {
  assert.doesNotMatch(source, /\bcron\.(schedule|alter_job|unschedule)\s*\(/i);
  assert.doesNotMatch(source, /\bnet\.http_(post|get)\s*\(/i);
  assert.doesNotMatch(source, /powerhouse_runtime_scheduler_mux_v3\s*\(/i);
  assert.match(source, /external_replay_allowed boolean NOT NULL DEFAULT false CHECK \(external_replay_allowed = false\)/i);
  assert.match(source, /'replay_performed',false/);
  assert.match(source, /SECURITY INVOKER/);
});

test('keeps missing result proof separate from later successful executions', () => {
  assert.match(source, /CRON_EXECUTION_FAILED/);
  assert.match(source, /NO_CRON_EXECUTION_EVIDENCE/);
  assert.match(source, /INNER_TASK_FAILED/);
  assert.match(source, /RESULT_READBACK_REQUIRED/);
  assert.match(source, /LEFT JOIN powerhouse_ops\.runtime_scheduler_run_evidence_v1/);
  assert.match(source, /ON CONFLICT \(jobid,run_slot\)/);
  assert.match(source, /resolution_state='RESULT_READBACK_REQUIRED'/);
});

test('caps audit workload and isolates evidence in private schema', () => {
  assert.match(source, /p_since > interval '48 hours'/);
  assert.match(source, /p_limit > 2000/);
  assert.match(source, /pg_try_advisory_xact_lock/);
  assert.match(source, /REVOKE ALL ON TABLE powerhouse_ops\.runtime_scheduler_gap_ledger_v1/);
  assert.match(source, /REVOKE ALL ON FUNCTION powerhouse_ops\.capture_runtime_scheduler_gaps_v1/);
});
