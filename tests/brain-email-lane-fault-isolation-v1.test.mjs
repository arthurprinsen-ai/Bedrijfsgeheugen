import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261009135700_commercial_email_lane_fault_isolation_4198.sql','utf8');
test('reuse the canonical scheduler without creating any parallel cron',()=>{
  assert.match(sql,/cron\.alter_job/);
  assert.match(sql,/jobid = 116/);
  assert.match(sql,/jobname = 'powerhouse-commercial-learning-v1'/);
  assert.match(sql,/CANONICAL_COMMERCIAL_JOB_NOT_PRESENT_NO_OP/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/);
});
test('refresh the entire connection graph once per local date, independent of later commercial errors',()=>{
  assert.match(sql,/enriched_today < total_connections/);
  assert.match(sql,/powerhouse_commercial_intelligence_context_stage_v1/);
  assert.match(sql,/EXCEPTION WHEN OTHERS THEN\s+RAISE WARNING 'POWERHOUSE_DAILY_ENRICHMENT_FAILED/);
});
test('canonical email fallback only runs when the main commercial cycle failed',()=>{
  assert.match(sql,/v_commercial_completed := true/);
  assert.match(sql,/IF NOT v_commercial_completed THEN/);
  assert.match(sql,/powerhouse_prepare_autonomous_outreach_v1/);
  assert.match(sql,/powerhouse_optimize_prepared_outreach_v1/);
  assert.match(sql,/powerhouse_dispatch_autonomous_outreach_v1/);
  assert.doesNotMatch(sql,/GMAIL_SEND_EMAIL|SALESROBOT_SEND_MESSAGE|human_approved\s*:=\s*true/i);
});
