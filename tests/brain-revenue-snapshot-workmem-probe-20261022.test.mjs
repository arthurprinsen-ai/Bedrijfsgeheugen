import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261022115200_p0_4215_snapshot_local_workmem_probe_v1.sql','utf8');

test('exact same canonical one-scheduler owner; never creates a second cron',()=>{
 assert.match(sql,/WHERE jobname='powerhouse-revenue-intelligence-snapshot-15m'/);
 assert.match(sql,/owner_row\.schedule<>'55 \* \* \* \*'/);
 assert.match(sql,/P0_4215_LEGACY_PREVIEW_OWNER_PRESERVED/);
 assert.match(sql,/P0_4215_SNAPSHOT_OWNER_ABSENT_PREVIEW/);
 assert.match(sql,/cron\.alter_job\(job_id:=owner_row\.jobid,command:=desired_command\)/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
 assert.doesNotMatch(sql,/cron\.unschedule\s*\(/i);
 assert.doesNotMatch(sql,/\btruncate\b|\bdelete\s+from\b|\bcreate\s+or\s+replace\s+function\b/i);
});
test('performance probe is local and preserves finance computation and deduplication',()=>{
 assert.match(sql,/set_config\(''work_mem'',''8MB'',true\)/);
 assert.match(sql,/set_config\(''statement_timeout'',''90000'',true\)/);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.match(sql,/powerhouse_ensure_commercial_progression_forecasts_v1/);
 assert.match(sql,/powerhouse_refresh_revenue_intelligence_snapshot_v1/);
 assert.match(sql,/P0_4215_SNAPSHOT_OWNER_OR_COMMAND_DRIFT/);
 assert.match(sql,/P0_4215_UNEXPECTED_EXISTING_WORKMEM_VALUE/);
 assert.match(sql,/P0_4215_SNAPSHOT_POSTWRITE_CAS_FAILED/);
 assert.doesNotMatch(sql,/statement_timeout'',''(120000|180000|0)/);
});
test('observed local session alteration is idempotent on production',()=>{
 assert.match(sql,/IF position\('work_mem' IN owner_row.command\)>0 THEN/);
 assert.match(sql,/P0_4215_SNAPSHOT_LOCAL_WORKMEM_ALREADY_PRESENT/);
 assert.match(sql,/desired_command := replace\(owner_row.command,old_anchor,memory_clause\|\|chr\(10\)\|\|old_anchor\)/);
});
