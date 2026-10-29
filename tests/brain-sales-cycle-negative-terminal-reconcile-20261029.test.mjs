import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20261029125100_sales_cycle_negative_terminal_reconcile_v1.sql','utf8');
test('skipped/expired/error actions end blocked without invented execution',()=>{
 assert.match(sql,/if v_action.status='done' and v_action.executed_at is not null then/);
 assert.match(sql,/elsif v_action.status in \('error','expired','skipped'\) then/);
 assert.doesNotMatch(sql,/v_action.status='done' or v_action.outcome_id is not null/);
});
test('historical reconciliation is evidence-tight and does not mutate immutable event log',()=>{
 for(const predicate of [
 /c.tenant_id='canonical'/,
 /c.status IN \('open','outcome_pending'\)/,
 /a.status IN \('expired','skipped'\)/,
 /a.executed_at IS NULL/,
 /o.outcome_type='not_executed'/,
 /COALESCE\(o.revenue_eur,0\)=0/,
 /o.action_id=a.action_id/
 ])assert.match(sql,predicate);
 assert.match(sql,/UPDATE public.powerhouse_decision_cycles c/);
 assert.doesNotMatch(sql,/UPDATE public.powerhouse_cycle_events/i);
 assert.doesNotMatch(sql,/DELETE FROM public.powerhouse_cycle_events/i);
 assert.doesNotMatch(sql,/cron\.schedule|CREATE\s+TABLE|INSERT\s+INTO\s+public\.powerhouse_sales_actions/i);
});
test('time and lock bounded with counted deployment notice',()=>{
 assert.match(sql,/SET LOCAL statement_timeout = '30s'/);
 assert.match(sql,/SET LOCAL lock_timeout = '3s'/);
 assert.match(sql,/GET DIAGNOSTICS v_corrected = ROW_COUNT/);
});
