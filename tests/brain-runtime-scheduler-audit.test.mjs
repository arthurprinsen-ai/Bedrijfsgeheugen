import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20261014184500_runtime_scheduler_audit.sql','utf8');
test('scheduler 171 records task outcomes in private durable table',()=>{
 assert.match(sql,/create table if not exists powerhouse_ops\.runtime_scheduler_run_evidence_v1/);
 assert.match(sql,/TASK_FAILURE/);
 assert.match(sql,/SKIPPED_OVERLAP/);
 assert.match(sql,/v_result->'tasks'/);
 assert.match(sql,/revoke all on powerhouse_ops\.runtime_scheduler_run_evidence_v1 from public,anon,authenticated/);
});
test('scheduler 171 never blind replays provider sends or changes cadence',()=>{
 assert.match(sql,/Unknown job 171 source; no update applied/);
 assert.match(sql,/cron\.alter_job\(171,command/);
 assert.doesNotMatch(sql,/cron\.unschedule/);
 assert.doesNotMatch(sql,/campaign_start|send_mail|send_email/);
});
