import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261023145500_revenue_learning_bounded_fair_reconciliation.sql','utf8');
const edge=readFileSync('supabase/functions/revenue-learning-store/index.ts','utf8');
const wrapper=readFileSync('netlify/functions/revenue-learning-evaluate.mjs','utf8');

test('one atomic server-side batch reuses existing obligation reconciliation authority',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_reconcile_action_learning_batch_v1/);
  assert.match(sql,/PERFORM public\.powerhouse_reconcile_action_learning_obligations_v1\(v_action\.action_id\)/);
  assert.match(sql,/v_limit integer := LEAST\(GREATEST\(COALESCE\(p_limit,20\),1\),20\)/);
  assert.match(sql,/ORDER BY ob\.updated_at ASC NULLS FIRST/);
  assert.match(sql,/a\.executed_at ASC, a\.action_id ASC/);
  assert.match(sql,/ob\.obligation_id='sales-action:'\|\|a\.action_id::text\|\|':outcome'/);
  assert.doesNotMatch(sql,/CREATE TABLE|CREATE EXTENSION|cron\.schedule|DELETE FROM/i);
});
test('new function is invoker-only and executable only by the existing service role',()=>{
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/SET search_path = pg_catalog, public/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_reconcile_action_learning_batch_v1\(integer\) FROM PUBLIC/);
  assert.match(sql,/FROM anon/);
  assert.match(sql,/FROM authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_reconcile_action_learning_batch_v1\(integer\) TO service_role/);
  assert.doesNotMatch(sql,/SECURITY DEFINER/);
});
test('Edge invokes a bounded single database RPC, not repeated oldest-50 requests',()=>{
  assert.match(edge,/db\.rpc\('powerhouse_reconcile_action_learning_batch_v1',\{p_limit:20\}\)/);
  assert.doesNotMatch(edge,/order\('executed_at',\{ascending:true\}\)\.limit\(50\)/);
  assert.match(edge,/RECONCILIATION_TENANT_FORBIDDEN/);
  assert.match(edge,/RECONCILIATION_RECEIPT_INVALID/);
  assert.match(edge,/verified_customer_value:false/);
  assert.match(edge,/BOUNDED_RECONCILIATION_ONLY/);
});
test('an incomplete batch does not authorize a green revenue learning claim',()=>{
  assert.match(sql,/'remaining_review_required',v_total>v_selected/);
  assert.match(edge,/remaining_review_required:result\.remaining_review_required===true/);
  assert.match(wrapper,/reconcileActionLearningObligations/);
  assert.match(wrapper,/await active\.listDueEvidence/);
  assert.match(wrapper,/export const config=\{schedule:'@hourly'\}/);
});
