-- Internal replay queue, deliberately restricted to idempotent operational tasks.
-- No email/DM/post/like provider mutation may be enqueued in this queue.
BEGIN;
CREATE SCHEMA IF NOT EXISTS powerhouse_ops;
REVOKE ALL ON SCHEMA powerhouse_ops FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA powerhouse_ops TO postgres;
CREATE TABLE IF NOT EXISTS powerhouse_ops.runtime_retry_queue (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 task_name text NOT NULL CHECK(task_name IN ('execution-resilience-watchdog','reconciliation-worker')),
 slot_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','completed','dead_letter')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 last_error text,
 result jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(task_name,slot_at)
);
REVOKE ALL ON powerhouse_ops.runtime_retry_queue FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS runtime_retry_due_idx ON powerhouse_ops.runtime_retry_queue(next_attempt_at)
 WHERE state='pending';
CREATE OR REPLACE FUNCTION powerhouse_ops.run_operational_task_v1(p_task text, p_slot timestamptz DEFAULT date_trunc('minute',now()))
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO pg_catalog, public, powerhouse_ops
AS $fn$
DECLARE
 v_sql text;
 v_receipt jsonb;
 v_reason text;
BEGIN
 IF p_task='execution-resilience-watchdog' THEN
   v_sql:='select public.powerhouse_execution_resilience_watchdog_v1()';
 ELSIF p_task='reconciliation-worker' THEN
   v_sql:='select public.powerhouse_reconciliation_worker_v2()';
 ELSE
   RAISE EXCEPTION 'UNREGISTERED_RECOVERY_TASK';
 END IF;
 BEGIN
   v_receipt:=public.powerhouse_runtime_mux_task_v1(p_task,v_sql,8000);
 EXCEPTION WHEN OTHERS THEN
   v_reason:=left(SQLERRM,250);
   v_receipt:=jsonb_build_object('ok',false,'error',v_reason);
 END;
 IF coalesce((v_receipt->>'ok')::boolean,false)=false THEN
   INSERT INTO powerhouse_ops.runtime_retry_queue(task_name,slot_at,last_error)
   VALUES(p_task,date_trunc('minute',p_slot),left(coalesce(v_receipt->>'error','FAILED_WITHOUT_DETAIL'),250))
   ON CONFLICT(task_name,slot_at) DO NOTHING;
 END IF;
 RETURN v_receipt;
END
$fn$;
CREATE OR REPLACE FUNCTION powerhouse_ops.replay_operational_failures_v1(p_limit int DEFAULT 3)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO pg_catalog, public, powerhouse_ops
AS $fn$
DECLARE
 v_job record;
 v_receipt jsonb;
 v_processed int:=0;
 v_success int:=0;
 v_reason text;
BEGIN
 IF p_limit<1 OR p_limit>5 THEN RAISE EXCEPTION 'RETRY_LIMIT_OUT_OF_BOUNDS'; END IF;
 IF NOT pg_try_advisory_xact_lock(hashtextextended('powerhouse-ops-operational-retry',0)) THEN
   RETURN jsonb_build_object('state','PEER_RUNNING');
 END IF;
 FOR v_job IN
   SELECT id,task_name,attempts FROM powerhouse_ops.runtime_retry_queue
   WHERE state='pending' AND next_attempt_at<=now()
   ORDER BY next_attempt_at,id LIMIT p_limit FOR UPDATE SKIP LOCKED
 LOOP
   v_processed:=v_processed+1;
   BEGIN
     IF v_job.task_name='execution-resilience-watchdog' THEN
       v_receipt:=public.powerhouse_runtime_mux_task_v1(v_job.task_name,
         'select public.powerhouse_execution_resilience_watchdog_v1()',8000);
     ELSIF v_job.task_name='reconciliation-worker' THEN
       v_receipt:=public.powerhouse_runtime_mux_task_v1(v_job.task_name,
         'select public.powerhouse_reconciliation_worker_v2()',8000);
     ELSE
       RAISE EXCEPTION 'UNREGISTERED_RECOVERY_TASK';
     END IF;
     v_reason:=left(coalesce(v_receipt->>'error','RECEIPT_NOT_OK'),250);
   EXCEPTION WHEN OTHERS THEN
     v_receipt:=jsonb_build_object('ok',false);
     v_reason:=left(SQLERRM,250);
   END;
   UPDATE powerhouse_ops.runtime_retry_queue SET
     attempts=attempts+1,
     state=CASE WHEN coalesce((v_receipt->>'ok')::boolean,false) THEN 'completed'
                WHEN attempts+1>=5 THEN 'dead_letter' ELSE 'pending' END,
     next_attempt_at=now()+make_interval(mins=>least(60,2^(attempts+1))::integer),
     last_error=CASE WHEN coalesce((v_receipt->>'ok')::boolean,false) THEN NULL ELSE v_reason END,
     result=v_receipt,updated_at=now() WHERE id=v_job.id;
   IF coalesce((v_receipt->>'ok')::boolean,false) THEN v_success:=v_success+1; END IF;
 END LOOP;
 RETURN jsonb_build_object('contract','powerhouse-operational-retry-v1',
   'processed',v_processed,'completed',v_success,'remaining',v_processed-v_success);
END
$fn$;
REVOKE ALL ON FUNCTION powerhouse_ops.run_operational_task_v1(text,timestamptz) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION powerhouse_ops.replay_operational_failures_v1(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION powerhouse_ops.run_operational_task_v1(text,timestamptz) TO postgres;
GRANT EXECUTE ON FUNCTION powerhouse_ops.replay_operational_failures_v1(integer) TO postgres;
SELECT cron.schedule('powerhouse-runtime-isolated-execution-resilience-watchdog',
 '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *',
 'select powerhouse_ops.run_operational_task_v1(''execution-resilience-watchdog'')');
SELECT cron.schedule('powerhouse-runtime-isolated-reconciliation-worker',
 '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *',
 'select powerhouse_ops.run_operational_task_v1(''reconciliation-worker'')');
SELECT cron.schedule('powerhouse-operational-retry-worker','*/2 * * * *',
 'select powerhouse_ops.replay_operational_failures_v1(3)');
COMMIT;
