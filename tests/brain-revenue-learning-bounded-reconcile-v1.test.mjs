import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261023144500_revenue_learning_atomic_bounded_batch_v1.sql',import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/revenue-learning-store/index.ts',import.meta.url),'utf8');
const store=readFileSync(new URL('../netlify/functions/_revenue-learning-store.mjs',import.meta.url),'utf8');
const evaluator=readFileSync(new URL('../netlify/functions/revenue-learning-evaluate.mjs',import.meta.url),'utf8');
const branch=edge.split("if(action==='reconcile_action_learning_obligations'){")[1]?.split("if(action==='get_projection'){")[0];

test('one existing service-token scheduler and no repeated oldest-50 serial HTTP RPC loop',()=>{
  assert.ok(branch,'existing store reconciliation route must exist');
  assert.match(branch,/db\.rpc\('powerhouse_reconcile_action_learning_batch_v1',\{p_limit:16\}\)/);
  assert.doesNotMatch(branch,/\.limit\(50\)/);
  assert.doesNotMatch(branch,/for\s*\(const actionRow/);
  assert.match(edge,/x-bg-service-token/);
  assert.match(evaluator,/schedule:'@hourly'/);
});
test('bounded transaction uses existing evidence receipts for complete fair rotation',()=>{
  assert.match(migration,/CREATE OR REPLACE FUNCTION public\.powerhouse_reconcile_action_learning_batch_v1/);
  assert.match(migration,/pg_try_advisory_xact_lock/);
  assert.match(migration,/count\(o\.obligation_id\)=3/);
  assert.match(migration,/min\(o\.updated_at\)/);
  assert.match(migration,/ASC NULLS FIRST/);
  assert.match(migration,/a\.executed_at ASC, a\.action_id ASC/);
  assert.match(migration,/p_limit > 16/);
  assert.match(migration,/LIMIT p_limit/);
});
test('same canonical three source receipts and no second status store',()=>{
  for(const type of [':outcome',':economics',':feedback'])
    assert.ok(migration.includes(type));
  assert.match(migration,/PERFORM public\.powerhouse_reconcile_action_learning_obligations_v1/);
  assert.doesNotMatch(migration,/CREATE TABLE|CREATE MATERIALIZED VIEW|pg_cron|cron\.schedule/i);
  assert.match(migration,/BEGIN;/);
  assert.match(migration,/COMMIT;/);
});
test('service only privilege, and role readback assertion',()=>{
  assert.match(migration,/REVOKE ALL ON FUNCTION[\s\S]*?FROM PUBLIC, anon, authenticated/);
  assert.match(migration,/GRANT EXECUTE ON FUNCTION[\s\S]*?TO service_role/);
  assert.match(migration,/has_function_privilege\('anon'/);
  assert.match(migration,/has_function_privilege\('authenticated'/);
  assert.match(migration,/has_function_privilege\('service_role'/);
});
test('contention, deployment mismatch and provider failure remain red rather than false green',()=>{
  assert.match(branch,/CANONICAL_RECONCILE_SINGLEFLIGHT_BUSY/);
  assert.match(branch,/degraded:true/);
  assert.match(branch,/RECONCILE_BATCH_PROVIDER_PROOF_INVALID/);
  assert.match(branch,/if\(error\)throw error/);
  assert.match(store,/data\?\.degraded===true/);
});
test('bounded progress is not presented as full action coverage or realized revenue',()=>{
  assert.match(branch,/BOUNDED_BATCH_NOT_FULL_EVIDENCE/);
  assert.match(branch,/source_total:data\.total_executed/);
  assert.match(migration,/BOUNDED_NOT_ALL_ACTIONS/);
  assert.doesNotMatch(branch,/status:'PROVEN'|realized_value/);
});
