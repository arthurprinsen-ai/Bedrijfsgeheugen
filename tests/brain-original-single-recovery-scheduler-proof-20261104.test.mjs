import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261104073000_original_single_heartbeat_recovery_owner_v1.sql', import.meta.url),'utf8');
const lower=sql.toLowerCase();

test('exact original runtime mux and unchanged ONE BRAIN policy error semantics',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_runtime_mux_task_v1\(p_task text, p_sql text, p_timeout_ms integer DEFAULT 10000\)/);
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/if p_task = 'one-brain-reconcile' and/);
 assert.match(sql,/ONE_BRAIN_POLICY_PROMOTION_DEGRADED/);
 assert.match(sql,/when query_canceled then/);
 assert.match(sql,/when others then/);
 assert.match(sql,/p_timeout_ms < 1000 or p_timeout_ms > 30000/);
});
test('same original Heartbeat terminal task captures private source only after strict receipt',()=>{
 assert.match(sql,/p_task in \('one-brain-reconcile','terminal-autonomous-reconcile'\)/);
 assert.match(sql,/execute p_sql into v_receipt/);
 assert.match(sql,/terminal-autonomous-reconciler-v2/);
 assert.match(sql,/ORIGINAL_TERMINAL_RECEIPT_MISSING/);
 assert.match(sql,/public\.powerhouse_recovery_review_truth_v1\(\)/);
 assert.match(sql,/original-recovery-queue-outcome-proof-v1/);
 assert.match(sql,/ORIGINAL_RECOVERY_PROOF_UNAVAILABLE/);
 assert.match(sql,/'recovery_provider_resolution_proven',false/);
 assert.match(sql,/'recovery_review_truth',v_recovery_truth/);
 assert.doesNotMatch(sql,/'provider_success_count',\s*\d+/);
});
test('one owner: preserve original cron #171 and remove only exact redundant original #184',()=>{
 assert.match(sql,/jobid=171 AND active/);
 assert.match(sql,/jobname='powerhouse-runtime-scheduler-mux-v1'/);
 assert.match(sql,/powerhouse_runtime_scheduler_mux_v3/);
 assert.match(sql,/schedule='1-59\/5,3-59\/5,4-59\/5 \* \* \* \*'/);
 assert.match(sql,/v_count <> 1/);
 assert.match(sql,/CANONICAL_HEARTBEAT_171_NOT_VERIFIED/);
 assert.match(sql,/ORIGINAL_RECOVERY_OWNER_SIGNATURE_DRIFT/);
 assert.match(sql,/v_jobname <> 'powerhouse-original-recovery-control-plane-v1'/);
 assert.match(sql,/trim\(v_command\) <> 'select public\.powerhouse_recovery_control_plane_tick_v1\(\);'/);
 assert.match(sql,/PERFORM cron\.unschedule\(v_jobid\)/);
 assert.doesNotMatch(lower,/cron\.schedule\s*\(/);
 assert.doesNotMatch(lower,/drop\s+function|drop\s+table|alter\s+table\s+powerhouse_ops/);
});
test('no new writer, queue, provider replay, or public privilege expansion',()=>{
 assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\)\s+FROM PUBLIC, anon, authenticated;/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\)\s+TO service_role;/);
 assert.doesNotMatch(sql,/GRANT EXECUTE[^;]+TO (?:PUBLIC|anon|authenticated)/i);
 assert.doesNotMatch(lower,/create\s+(?:table|trigger)|pg_net|net\.http_post|http_post|create\s+extension/);
 assert.doesNotMatch(lower,/\b(?:insert\s+into|update|delete\s+from)\s+powerhouse_ops\./);
});
