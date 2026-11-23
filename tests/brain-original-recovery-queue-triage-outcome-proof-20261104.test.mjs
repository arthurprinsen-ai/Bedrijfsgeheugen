import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261104051200_original_recovery_queue_outcome_proof_v1.sql', import.meta.url), 'utf8');
const lower = sql.toLowerCase();

test('the original exclusive recovery owner remains in place, with no second scheduler', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.powerhouse_recovery_control_plane_tick_v1\(\)/);
  assert.match(sql, /pg_try_advisory_xact_lock/);
  assert.match(sql, /public\.powerhouse_execution_resilience_watchdog_v1\(\)/);
  assert.match(sql, /public\.powerhouse_reconciliation_worker_v2\(\)/);
  assert.doesNotMatch(lower, /cron\.(?:schedule|unschedule)|create\s+(?:table|trigger)|pg_net|http_post/);
  assert.doesNotMatch(lower, /\b(?:insert\s+into|update\s+|delete\s+from|truncate)\s+powerhouse_ops\./);
});
test('review success and independently proven provider outcome never become the same state', () => {
  assert.match(sql, /public\.powerhouse_recovery_review_truth_v1\(\)/);
  assert.match(sql, /q\.task_key = 'cron_failure_review'/);
  assert.match(sql, /q\.status = 'succeeded'/);
  assert.match(sql, /UNRESOLVED/);
  assert.match(sql, /'review_completion_is_provider_resolution', false/);
  assert.match(sql, /'provider_resolution', 'NOT_PROVEN_FROM_TRIAGE_RECORD'/);
  assert.match(sql, /'provider_success_count', NULL/);
  assert.match(sql, /'outcome_state',\s*CASE/);
  assert.match(sql, /'recovery_review_truth', v_recovery_truth/);
  assert.match(sql, /'recovery_provider_resolution_proven', false/);
  assert.match(sql, /'ok', true/); // means controller execution only
});
test('private incident history is projected only as aggregate read-only evidence', () => {
  assert.match(sql, /RETURNS jsonb\s+LANGUAGE sql\s+STABLE\s+SECURITY DEFINER/);
  assert.match(sql, /SET search_path TO pg_catalog, powerhouse_ops/);
  assert.match(sql, /count\(\*\) FILTER/);
  assert.doesNotMatch(sql, /jsonb_agg\s*\(\s*q\./i);
  assert.doesNotMatch(sql, /SELECT\s+q\.payload\b/i);
  assert.doesNotMatch(sql, /'raw_failures'/i);
});
test('public callers cannot execute either privileged recovery function', () => {
  const signatures = ['powerhouse_recovery_review_truth_v1', 'powerhouse_recovery_control_plane_tick_v1'];
  for(const fn of signatures){
    assert.ok(sql.includes('REVOKE '), 'SQL must revoke public execution');
    const signature = new RegExp('REVOKE (?:ALL|EXECUTE) ON FUNCTION public\\.' + fn + '\\(\\)[\\s\\S]*?FROM (?:PUBLIC|public), anon, authenticated;', 'm');
    assert.match(sql, signature);
    const grant = new RegExp('GRANT EXECUTE ON FUNCTION public\\.' + fn + '\\(\\)[\\s\\S]*?TO service_role;', 'm');
    assert.match(sql, grant);
  }
  assert.doesNotMatch(sql, /GRANT\s+EXECUTE[^;]+TO\s+(?:PUBLIC|anon|authenticated)/i);
  assert.doesNotMatch(sql, /GRANT\s+(?:SELECT|USAGE)\s+ON\s+(?:ALL\s+)?(?:TABLES|SCHEMA)/i);
});
test('lifecycle evidence remains open until independent original provider and customer outcome proof', () => {
  assert.match(sql, /CAS-close individual incidents only with independent evidence/);
  assert.match(sql, /Never replay UNKNOWN side effects/);
  assert.match(sql, /NOT_EVALUATED_OVERLAPPING_ORIGINAL_OWNER/);
  assert.match(sql, /SOURCE_CHECK_ONLY_PROVIDER_READBACK_DUE/);
});
