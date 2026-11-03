// Existing ONE BRAIN/mux sources: no new scheduler, no bypass and no false-green.
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const sql=readFileSync(new URL('../supabase/migrations/20261103223001_one_brain_policy_promotion_failure_receipts_v1.sql',import.meta.url),'utf8');

test('original policy-reconciliation errors reach the canonical ONE BRAIN register',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_one_brain_reconcile_v1\(/i);
  assert.match(sql,/get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE/i);
  assert.match(sql,/public\.brain_observe_failure\(/);
  assert.match(sql,/powerhouse\|one-brain\|silent-policy-promotion-failure\|20261103-v1/);
  assert.match(sql,/experiment_key_sha256/);
  assert.doesNotMatch(sql,/One policy must not stop reconciliation[^\n]*\n\s*null;/);
  assert.match(sql,/policy_promotion_error_count',v_policy_errors/);
  assert.match(sql,/v_failure_receipts := v_failure_receipts \|\| jsonb_build_array/);
});

test('existing scheduler task visibly fails if original policy work failed',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_runtime_mux_task_v1\(/i);
  assert.match(sql,/if p_task = 'one-brain-reconcile' then\s+execute p_sql into v_receipt;/);
  assert.match(sql,/v_receipt is null or[\s\S]*?policy_promotion_error_count/);
  assert.match(sql,/'ok',false,[\s\S]*?'state','ONE_BRAIN_POLICY_PROMOTION_DEGRADED'/);
  assert.match(sql,/else\s+execute p_sql;\s+end if;/);
  assert.match(sql,/when query_canceled then/);
});

test('no new executor, cron, consent override or external action was introduced',()=>{
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
  assert.doesNotMatch(sql,/cron\.unschedule\s*\(/i);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_one_brain_reconcile_v1\(timestamptz\)[\s\S]*?FROM PUBLIC, anon, authenticated;/i);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_one_brain_reconcile_v1\(timestamptz\)[\s\S]*?TO service_role;/i);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\)[\s\S]*?FROM PUBLIC, anon, authenticated;/i);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_runtime_mux_task_v1\(text,text,integer\)[\s\S]*?TO service_role;/i);
  assert.doesNotMatch(sql,/GRANT EXECUTE[^;]*TO\s+(?:PUBLIC|anon|authenticated)/i);
  assert.doesNotMatch(sql,/http_post|pg_net|linkedin.*send|instagram.*publish/i);
  assert.match(sql,/SECURITY DEFINER/);
});
