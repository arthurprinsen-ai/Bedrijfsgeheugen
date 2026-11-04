import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const m=readFileSync(new URL('../supabase/migrations/20261104065001_original_recovery_control_plane_native_pgcron_v1.sql',import.meta.url),'utf8');
test('only original pg_cron owner scheduled, no parallel executor',()=>{
 assert.match(m,/powerhouse-original-recovery-control-plane-v1/);
 assert.match(m,/cron\.schedule\(v_name, v_schedule, v_command\)/);
 assert.match(m,/powerhouse_recovery_control_plane_tick_v1\(\)/);
 assert.match(m,/v_schedule constant text := '\*\/15 \* \* \* \*'/);
 assert.doesNotMatch(m,/http_post|net\.http|Make|Buffer|CREATE (OR REPLACE )?FUNCTION|cron\.unschedule|DELETE FROM cron\.job/i);
});
test('fail closed with existing original job, missing function or unsafe duplicate',()=>{
 for(const v of ['ORIGINAL_RECOVERY_OWNER_FUNCTION_NOT_DEPLOYED','ORIGINAL_RECOVERY_OUTCOME_PROOF_NOT_DEPLOYED','ORIGINAL_RECOVERY_CONTROL_PLANE_DUPLICATE_OWNER','ORIGINAL_RECOVERY_CONTROL_PLANE_JOB_NAME_CONFLICT','ORIGINAL_RECOVERY_CRON_REGISTERED_NOT_ACTIVE'])assert.ok(m.includes(v),v);
 assert.match(m,/WHERE active AND command ILIKE '%powerhouse_recovery_control_plane_tick_v1%'/);
 assert.match(m,/v_recovery_jobs = 1 AND v_existing\.jobname = v_name/);
 assert.match(m,/v_existing\.schedule = v_schedule/);
 assert.match(m,/trim\(v_existing\.command\) = v_command/);
 assert.match(m,/RETURN; -- idempotent/);
});
test('original outcome truth and native advisory lease prerequisites retained',()=>{
 assert.match(m,/to_regprocedure\('public\.powerhouse_recovery_review_truth_v1\(\)'\)/);
 assert.match(m,/to_regprocedure\('public\.powerhouse_recovery_control_plane_tick_v1\(\)'\)/);
});
