import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261014133500_powerhouse_scheduler_isolated_tasks.sql','utf8');
const slots='1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59';
const expected={
  'execution-resilience-watchdog':slots,
  'reconciliation-worker':slots,
  'public-rls-guard':'1,6,11,16,21,26,31,36,41,46,51,56',
  'daily-action-set-reconcile':'11,26,41,56',
  'content-closed-loop':'4,9,14,19,24,29,34,39,44,49,54,59',
  'data-spine-watchdog':'1,11,21,31,41,51',
  'terminal-autonomous-reconcile':'3,8,13,18,23,28,33,38,43,48,53,58',
  'loop-assurance':'14,29,44,59',
  'email-execution-watchdog':'6,16,26,36,46,56',
  'one-brain-reconcile':'13,43',
  'revenue-attribution-snapshot':'4,19,34,49',
  'linkedin-oauth-resume-reconcile':'18,48',
  'regression-stage-evidence':'23,53',
  'seo-assurance':'28,58',
  'freshness-contradiction-cache':'6,21,36,51',
  'prediction-learning-audit':'4 6 * * *'
};

test('all v1 tasks preserve their exact original cron minute slots',()=>{
  for(const [name,minutes] of Object.entries(expected)){
    const schedule=minutes.includes(' ') ? minutes : minutes+' * * * *';
    const fragment=`SELECT cron.schedule('powerhouse-runtime-isolated-${name}', '${schedule}'`;
    assert.ok(sql.includes(fragment),`missing schedule for ${name}`);
  }
});
test('v2/v3 sources and timezone-sensitive infinity are isolated',()=>{
  for(const name of ['dataforseo-intelligence','gsc-search','external-intelligence-bounded',
    'ga4-analytics','economics-backfill','social-learning-backfill','infinity-operating-loop']){
    assert.ok(sql.includes(name),name);
  }
  assert.match(sql,/Europe\/Amsterdam/);
  assert.match(sql,/cron\.schedule\('powerhouse-runtime-extras-v4'/);
});
test('migration swaps original multiplexed cron within one transaction',()=>{
  assert.match(sql,/BEGIN;/);
  assert.match(sql,/SELECT cron\.unschedule\(171\);/);
  assert.match(sql,/COMMIT;/);
  assert.ok(sql.indexOf('cron.unschedule(171)') > sql.indexOf('powerhouse-runtime-isolated-prediction-learning-audit'));
  assert.doesNotMatch(sql,/SET statement_timeout = 0/i);
});

const rolling=readFileSync('supabase/migrations/20261014135000_revenue_attribution_incremental.sql','utf8');
test('revenue attribution uses bounded staging and scoped atomic publication',()=>{
  assert.match(rolling,/CREATE TEMP TABLE revenue_delta_stage ON COMMIT DROP AS/);
  assert.match(rolling,/WHERE conversion_at >= p_since/);
  assert.match(rolling,/WHERE s\.conversion_at >= p_since AND NOT EXISTS/);
  assert.match(rolling,/ON CONFLICT\(outcome_id,touch_type,touch_id\) DO UPDATE/);
  assert.match(rolling,/IS DISTINCT FROM/);
  assert.match(rolling,/cron\.schedule\('powerhouse-runtime-isolated-revenue-attribution-snapshot'/);
  assert.doesNotMatch(rolling,/TRUNCATE TABLE|DELETE FROM public\.powerhouse_revenue_attribution_snapshot_v1\s*;/i);
});

const recovery=readFileSync('supabase/migrations/20261014135500_operational_recovery_queue.sql','utf8');
test('recovery queue is private, bounded, idempotent and does not replay provider sends',()=>{
  assert.match(recovery,/CREATE SCHEMA IF NOT EXISTS powerhouse_ops/);
  assert.match(recovery,/UNIQUE\(task_name,slot_at\)/);
  assert.match(recovery,/FOR UPDATE SKIP LOCKED/);
  assert.match(recovery,/attempts\+1>=5/);
  assert.match(recovery,/dead_letter/);
  assert.match(recovery,/ON CONFLICT\(task_name,slot_at\) DO NOTHING/);
  assert.match(recovery,/cron\.schedule\('powerhouse-operational-retry-worker'/);
  assert.doesNotMatch(recovery,/composio\.execute|gmail\.send|send_email|send_dm|send_linkedin/i);
});

test('cron cutover aborts safely if production scheduler identity drifts',()=>{
  assert.match(sql,/SCHEDULER_171_DRIFT_ABORT/);
  assert.match(sql,/WHERE jobid=171/);
  assert.match(sql,/powerhouse_runtime_scheduler_mux_v3\(now\(\)\)/);
  assert.ok(sql.indexOf('SCHEDULER_171_DRIFT_ABORT') < sql.indexOf('cron.unschedule(171)'));
});

const catalogAudit=readFileSync('scripts/brain/audit-ai-model-provider-sources.mjs','utf8');
test('provider catalog probe remains strictly evidence-only and never self-verifies claims',()=>{
  assert.match(catalogAudit,/claims_verified_by_this_probe:false/);
  assert.match(catalogAudit,/contract_dpa_verified:false/);
  assert.match(catalogAudit,/customer_runtime_residency_verified:false/);
  assert.match(catalogAudit,/claim_verifications_added:0/);
  assert.doesNotMatch(catalogAudit,/m\.verified_at\s*=|writeFile\(catalogPath/);
});

const rollback=readFileSync('scripts/sql/rollback_powerhouse_scheduler_isolation.sql','utf8');
test('manual rollback restores canonical schedule before retiring isolated jobs atomically',()=>{
  assert.match(rollback,/REFUSE_ROLLBACK_UNKNOWN_SCHEDULER_OWNER/);
  assert.match(rollback,/ROLLBACK_OWNER_DRIFT/);
  assert.match(rollback,/BEGIN;/);
  assert.match(rollback,/COMMIT;/);
  assert.match(rollback,/cron\.schedule\([\s\S]*?'powerhouse-runtime-scheduler-mux-v1'/);
  assert.ok(rollback.indexOf("SELECT cron.schedule(")<rollback.indexOf("PERFORM cron.unschedule(v_name)"));
  assert.match(rollback,/powerhouse-operational-retry-worker/);
  assert.doesNotMatch(rollback,/DROP TABLE|DROP SCHEMA|TRUNCATE TABLE/i);
});

const missed=readFileSync('supabase/migrations/20261014151000_runtime_missed_slot_reconciler.sql','utf8');
test('missed slots are detected independently and enqueued once with bounded backlog',()=>{
  assert.match(missed,/generate_series\(/);
  assert.match(missed,/cron\.job_run_details/);
  assert.match(missed,/d\.status='succeeded'/);
  assert.match(missed,/ON CONFLICT\(task_name,slot_at\) DO NOTHING/);
  assert.match(missed,/p_lookback_minutes > 60/);
  assert.match(missed,/interval '3 minutes'/);
  assert.match(missed,/pg_try_advisory_xact_lock/);
  assert.match(missed,/cron\.schedule\('powerhouse-ops-independent-slot-reconciler'/);
  assert.doesNotMatch(missed,/send_dm|send_email|composio|gmail\.send/i);
});

const acceptance=readFileSync('scripts/sql/powerhouse_runtime_recovery_acceptance.sql','utf8');
test('runtime acceptance is read-only, fail-closed and does not claim provider delivery',()=>{
  assert.match(acceptance,/INFRASTRUCTURE_READBACK_NOT_ACCEPTED/);
  assert.match(acceptance,/isolated_active FROM current_stats\)=16/);
  assert.match(acceptance,/old_mux_active FROM current_stats\)=0/);
  assert.match(acceptance,/cron\.job_run_details/);
  assert.match(acceptance,/timeout_runs_90m/);
  assert.match(acceptance,/recovery_dead_letter/);
  assert.match(acceptance,/powerhouse_refresh_revenue_attribution_incremental_v1/);
  assert.doesNotMatch(acceptance,/\b(?:UPDATE|INSERT|DELETE|DROP|TRUNCATE|ALTER|CREATE TABLE)\s+/i);
});

const outsideWatch=readFileSync('netlify/functions/powerhouse-external-database-watch.mjs','utf8');
test('independent Netlify watch persists outage evidence and never replays provider actions',()=>{
  assert.match(outsideWatch,/schedule: '\*\/5 \* \* \* \*'/);
  assert.match(outsideWatch,/getStore\(/);
  assert.match(outsideWatch,/store\.setJSON\(key/);
  assert.match(outsideWatch,/REST_READBACK_RECOVERED/);
  assert.match(outsideWatch,/db_cron_execution_proven:false/);
  assert.match(outsideWatch,/provider_delivery_verified:false/);
  assert.doesNotMatch(outsideWatch,/\/(?:functions\/v1|rpc\/)\w*dispatch|send_email|send_dm|publish_post/);
});
