import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261104065001_original_heartbeat_native_recovery_truth_v1.sql',import.meta.url),'utf8');

test('one original mux remains, without second scheduler or renamed owner',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_runtime_mux_task_v1\(p_task text, p_sql text, p_timeout_ms integer DEFAULT 10000\)/);
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/if p_timeout_ms < 1000 or p_timeout_ms > 30000 then/);
 assert.match(sql,/if p_task in \('one-brain-reconcile','terminal-autonomous-reconcile'\)/);
 assert.match(sql,/execute p_sql into v_receipt/);
 assert.match(sql,/if p_task = 'one-brain-reconcile' and/);
 assert.match(sql,/ONE_BRAIN_POLICY_PROMOTION_DEGRADED/);
 assert.doesNotMatch(sql,/cron\.(?:schedule|unschedule)|pg_net|http_post|create\s+table/i);
});

test('existing original natural terminal run consumes only original private read-only provider-proof source',()=>{
 assert.match(sql,/if p_task = 'terminal-autonomous-reconcile' then/);
 assert.match(sql,/v_receipt->>'contract' <> 'terminal-autonomous-reconciler-v2'/);
 assert.match(sql,/select public\.powerhouse_recovery_review_truth_v1\(\) into v_recovery_truth;/);
 assert.match(sql,/v_recovery_truth->>'contract' <> 'original-recovery-queue-outcome-proof-v1'/);
 assert.match(sql,/'recovery_review_truth',v_recovery_truth/);
 assert.match(sql,/'recovery_provider_resolution_proven',false/);
 assert.match(sql,/EXECUTION_COMPLETED_PROVIDER_OUTCOMES_SEPARATE/);
 assert.doesNotMatch(sql,/'recovery_provider_resolution_proven',true/);
});

test('absence of one provider source receipt fails closed; no artificial green',()=>{
 assert.match(sql,/TERMINAL_RECONCILER_SOURCE_RECEIPT_MISSING/);
 assert.match(sql,/RECOVERY_REVIEW_SOURCE_RECEIPT_MISSING/);
 assert.match(sql,/jsonb_typeof\(v_receipt\) <> 'object'/);
 assert.match(sql,/return jsonb_build_object\('task',p_task,'ok',false/);
 assert.match(sql,/when query_canceled then/);
 assert.match(sql,/when others then/);
 assert.match(sql,/'sqlstate',sqlstate/);
 assert.doesNotMatch(sql,/\b(update|insert into|delete from|truncate)\s+powerhouse_ops\.recovery_queue/i);
});

test('reusing protected original mux does not expose incident details or execution to browser roles',()=>{
 assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\) FROM PUBLIC, anon, authenticated;/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\) TO service_role;/);
 assert.doesNotMatch(sql,/GRANT\s+EXECUTE[^;]+TO\s+(?:PUBLIC|anon|authenticated)/i);
 assert.doesNotMatch(sql,/(?:jsonb_agg|raw_payload|external_id|customer_email)/i);
 assert.match(sql,/end\s*\$function\$;/);
});

test('historical migration version 64400 remains in original source after provider applied it',()=>{
 const historical=readFileSync(new URL('../supabase/migrations/20261104064400_original_heartbeat_recovery_review_receipt_v1.sql',import.meta.url),'utf8');
 assert.match(historical,/CREATE OR REPLACE FUNCTION public\.powerhouse_runtime_mux_task_v1/);
 assert.match(historical,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1/);
 assert.match(historical,/GRANT EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\) TO service_role;/);
 assert.doesNotMatch(historical,/cron\.(?:schedule|unschedule)/);
 assert.match(sql,/TERMINAL_RECONCILER_SOURCE_RECEIPT_MISSING/);
});
