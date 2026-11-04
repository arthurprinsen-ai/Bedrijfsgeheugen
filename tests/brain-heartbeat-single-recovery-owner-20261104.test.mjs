import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/migrations/20261104074100_original_heartbeat_single_recovery_owner_v1.sql',import.meta.url),'utf8');

test('one original mux remains, and no new scheduler/worker/publisher is created',()=>{
 assert.ok(source.includes("CREATE OR REPLACE FUNCTION public.powerhouse_runtime_mux_task_v1"));
 assert.ok(source.includes("if p_task in ('one-brain-reconcile','terminal-autonomous-reconcile')"));
 assert.ok(source.includes("if p_task = 'one-brain-reconcile' and"));
 assert.ok(source.includes("ONE_BRAIN_POLICY_PROMOTION_DEGRADED"));
 assert.ok(source.includes("else\n    execute p_sql;"));
 assert.ok(source.includes("if p_timeout_ms < 1000 or p_timeout_ms > 30000"));
 assert.equal(source.includes("cron.schedule("),false);
 assert.equal(source.includes("CREATE TABLE "),false);
 assert.equal(source.includes("net.http_post"),false);
});
test('terminal reconciler captures real original receipt and independent recovery source',()=>{
 assert.ok(source.includes("execute p_sql into v_receipt"));
 assert.ok(source.includes("v_recovery_truth := public.powerhouse_recovery_review_truth_v1()"));
 assert.ok(source.includes("v_receipt->>'contract' is distinct from 'terminal-autonomous-reconciler-v2'"));
 assert.ok(source.includes("v_recovery_truth->>'contract' is distinct from 'original-recovery-queue-outcome-proof-v1'"));
 assert.ok(source.includes("ORIGINAL_RECOVERY_SOURCE_PROOF_MISSING"));
 assert.ok(source.includes("'recovery_review_truth',v_recovery_truth"));
 assert.ok(source.includes("'recovery_provider_resolution_proven',false"));
 assert.ok(source.includes("'state','EXECUTED_OUTCOME_EVIDENCE_SEPARATE'"));
});
test('source failure is never misclassified as green and external effects are not replayed',()=>{
 assert.ok(source.includes("'ok',false"));
 assert.ok(source.includes("'state','ERROR'"));
 assert.ok(source.includes("'state','TIMEOUT'"));
 assert.equal(source.includes("public.powerhouse_social_publisher"),false);
 assert.equal(source.includes("public.content_publication_obligations"),false);
 assert.equal(source.includes("perform public.powerhouse_recovery_control_plane_tick_v1()"),false);
});
test('redundant #184 retired only when original #171 is live and exact job identity/ACL is proven',()=>{
 assert.ok(source.includes("jobname='powerhouse-original-recovery-control-plane-v1'"));
 assert.ok(source.includes("v_job.schedule <> '*/15 * * * *'"));
 assert.ok(source.includes("btrim(v_job.command) <> 'select public.powerhouse_recovery_control_plane_tick_v1();'"));
 assert.ok(source.includes("jobname='powerhouse-runtime-scheduler-mux-v1'"));
 assert.ok(source.includes("command LIKE '%powerhouse_runtime_scheduler_mux_v3%'"));
 assert.ok(source.includes("ORIGINAL_171_SCHEDULER_MISSING_KEEP_184"));
 assert.ok(source.includes("ORIGINAL_HEARTBEAT_PRIVILEGE_DRIFT_KEEP_184"));
 assert.ok(source.includes("PERFORM cron.unschedule(v_job.jobid)"));
});
test('role grants remain service-only and original function body properly closes',()=>{
 assert.ok(source.includes("$function$;"));
 assert.ok(source.includes("REVOKE EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) FROM PUBLIC, anon, authenticated;"));
 assert.ok(source.includes("GRANT EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) TO service_role;"));
 assert.equal(source.includes(" TO anon;"),false);
 assert.equal(source.includes(" TO authenticated;"),false);
});
