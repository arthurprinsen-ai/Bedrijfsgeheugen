import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../',import.meta.url);
const sql = await readFile(new URL('supabase/migrations/20261105153700_original_data_spine_decision_source_priority_v1.sql',root),'utf8');
const native = await readFile(new URL('supabase/migrations/20261105134200_original_data_spine_decision_receipt_same_tick_v1.sql',root),'utf8');

test('only original data-spine owner may write the ten-minute decision receipt',()=>{
  assert.match(native,/foreach v_stage in array array\['decision','action','outcome','learning','guard'\] loop/);
  assert.match(native,/'source_check_at',p_now/);
  assert.match(native,/'decision_kind',case when v_stage='decision'/);
  assert.match(sql,/if lower\(coalesce\(v_cron_status,''\)\) = 'succeeded' and r\.loop_key <> 'data-spine-watchdog' then/);
  assert.match(sql,/'decision',coalesce\(v_cron_end_time,v_cron_start_time\)/);
  assert.doesNotMatch(sql,/if lower\(coalesce\(v_cron_status,''\)\) = 'succeeded' then/);
});

test('generic cron still reports scheduler input and allowed non-native decisions, never fabricated business outcomes',()=>{
  assert.match(sql,/'input',v_cron_start_time/);
  assert.match(sql,/'evidence_type','cron_invocation'/);
  assert.match(sql,/'evidence_type','scheduled_policy_execution'/);
  assert.match(sql,/on conflict \(loop_key,stage\) do update/);
  assert.match(sql,/where public\.powerhouse_loop_assurance_receipts_v1\.observed_at <= excluded\.observed_at/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(|cron\.unschedule\s*\(|CREATE\s+TABLE/i);
  assert.match(sql,/\$function\$;\s*-- Preserve and explicitly reassert current production privilege boundary/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_sync_loop_assurance_receipts_v1\(timestamp with time zone\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_sync_loop_assurance_receipts_v1\(timestamp with time zone\) TO service_role;/);
  assert.doesNotMatch(sql,/GRANT EXECUTE ON FUNCTION [^\n]+ TO (?:PUBLIC|anon|authenticated)/i);
});

test('existing security and original reconciliation contract are retained',()=>{
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/SET search_path TO 'public', 'pg_catalog'/);
  assert.match(sql,/powerhouse_loop_assurance_registry_v1/);
  assert.match(sql,/powerhouse_runtime_events/);
  assert.match(sql,/return v_written;/);
  assert.match(native,/'customer_outcome_verified',false/);
  assert.match(native,/'causal_learning_verified',false/);
});
