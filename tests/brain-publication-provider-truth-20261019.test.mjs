import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261019215000_publication_provider_proof_reliability_v2.sql',import.meta.url),'utf8');
test('preserves existing provider created personal post across readback 403',()=>{
 assert.match(sql,/provider_publication_ack_verified/);
 assert.match(sql,/terminal_provider_side_effect/);
 assert.match(sql,/readback_permission_limited/);
 assert.match(sql,/republish_forbidden/);
 assert.match(sql,/o\.status='PUBLISHED'/);
});
test('uses existing canonical proof health rather than synthetic green',()=>{
 assert.match(sql,/powerhouse_publication_proof_health\(p_publication_date\)/);
 assert.match(sql,/blocking_count/);
 assert.match(sql,/watchdog_mutated_rows/);
 assert.match(sql,/MISSING_TERMINAL_PROVIDER_PROOF/);
});
test('retains original media job failure and business next action',()=>{
 assert.match(sql,/powerhouse_instagram_media_jobs_v1/);
 assert.match(sql,/nullif\(j\.last_error,''\)/);
 assert.match(sql,/nullif\(j\.next_action,''\)/);
});
test('does not reset FAILED or BLOCKED instruction during sync',()=>{
 assert.match(sql,/status in \('FAILED','BLOCKED'\)/);
 assert.match(sql,/content_publication_obligations\.next_action/);
 assert.doesNotMatch(sql,/Buffer dispatch/);
});
