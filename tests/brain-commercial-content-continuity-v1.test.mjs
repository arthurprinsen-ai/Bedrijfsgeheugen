import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261011110000_powerhouse_content_reconciliation_isolation_always_on_v1.sql','utf8');

test('reconciliation is isolated, not an exit from the existing publication executor',()=>{
  const reconcile=sql.indexOf('PERFORM public.powerhouse_reconcile_content_outcomes_v1');
  const isolated=sql.indexOf("RAISE WARNING 'CONTENT_OUTCOME_RECONCILE_ISOLATED:");
  const token=sql.indexOf("CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE");
  const provider=sql.indexOf('SELECT net.http_post(');
  assert.ok(reconcile>0 && isolated>reconcile && token>isolated && provider>token);
});
test('existing canonical token and 120-second provider timeout unchanged',()=>{
  assert.match(sql,/bg_geheim\('powerhouse_daily_scheduler_token'\)/);
  assert.match(sql,/x-powerhouse-token/);
  assert.match(sql,/timeout_milliseconds := 120000/);
});
test('existing scheduler only, hourly round-the-clock, no new cron job',()=>{
  assert.match(sql,/jobname='powerhouse-content-orchestrator-daily-v1'/);
  assert.match(sql,/cron\.alter_job\(v_job\.jobid/);
  assert.match(sql,/'27 \* \* \* \*'/);
  assert.doesNotMatch(sql,/cron\.schedule\(/);
  assert.doesNotMatch(sql,/cron\.unschedule\(/);
});
test('no publication permission bypass or credential reconfiguration',()=>{
  assert.doesNotMatch(sql,/grant\s+/i);
  assert.doesNotMatch(sql,/revoke\s+/i);
  assert.doesNotMatch(sql,/disable.*trigger/i);
  assert.doesNotMatch(sql,/set.*status\s*=\s*'LIVE_PROVEN'/i);
});
