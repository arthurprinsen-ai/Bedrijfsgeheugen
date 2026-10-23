import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const sql=readFileSync(new URL('../supabase/migrations/20261023054900_p0_4215_revenue_snapshot_shared_buying_v1.sql',import.meta.url),'utf8');
const valid=s=>
 s.includes('p0_buying AS MATERIALIZED (') &&
 s.split('p0_buying AS MATERIALIZED (').length===2 &&
 s.includes('p0_account AS (') &&
 s.includes('p0_research AS (') &&
 s.includes('p0_v2 AS (') &&
 s.includes('p0_v3 AS (') &&
 s.includes('p0_v4 AS (') &&
 s.includes('p0_maturity AS (') &&
 s.includes('p0_v5 AS (') &&
 s.includes('from p0_v5 v') &&
 !s.includes('from public.powerhouse_commercial_next_best_action_v5 v;');

test('P0 #4215: a single materialized buying-window CTE is reused across all dependent view projections',()=>{
 assert.equal(valid(sql),true);
});
test('P0 #4215: absent or duplicated shared cache cannot pass regression',()=>{
 assert.equal(valid(sql.replace('p0_buying AS MATERIALIZED (','p0_buying AS (')),false);
 assert.equal(valid(sql.replace('p0_buying AS MATERIALIZED (','p0_buying AS MATERIALIZED (\n SELECT NULL::text AS bad; p0_buying AS MATERIALIZED (')),false);
});
test('P0 #4215: fail closed on original function, optimized source, and dependent source hashes',()=>{
 for(const marker of ['P0_4215_SNAPSHOT_FUNCTION_SOURCE_DRIFT','P0_4215_SNAPSHOT_BUYING_VIEW_DRIFT',
 'P0_4215_SNAPSHOT_SOURCE_DRIFT','P0_4215_SNAPSHOT_SECURITY_PRECONDITION',
 'P0_4215_SNAPSHOT_SHARED_CTE_OR_ACL_POSTWRITE_DRIFT'])assert.ok(sql.includes(marker),marker);
 assert.ok(sql.includes('8559eb2824c31d41de5db065f4b92ac8'));
 assert.ok(sql.includes('dcac5a8d2543147d3d5e294cc14a599e'));
});
test('P0 #4215: preserve service-role-only security-definer function and transaction atomicity',()=>{
 for(const marker of ['BEGIN;','SECURITY DEFINER','SET search_path TO','DELETE FROM public.powerhouse_revenue_command_center_snapshot_v1',
 'insert into public.powerhouse_revenue_command_center_snapshot_v1(','GET DIAGNOSTICS v_row_count = ROW_COUNT;',
 'RETURN QUERY SELECT v_row_count,v_refreshed_at;','ROLLBACK']) {
  if(marker==='ROLLBACK')assert.ok(!sql.includes('ROLLBACK'),'source is a forward migration not a rollback');
  else assert.ok(sql.includes(marker),marker);
 }
 assert.ok(sql.includes('REVOKE ALL ON FUNCTION'));
 assert.ok(sql.includes('FROM PUBLIC, anon, authenticated;'));
 assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION'));
 assert.ok(sql.includes('TO service_role;'));
 assert.ok(!sql.includes('cron.schedule('));
 assert.ok(!sql.includes('cron.unschedule('));
});
test('P0 #4215: no shortcut to claiming finance, tenant isolation, full cron or production success',()=>{
 assert.ok(sql.includes('FULL RELEASE HOLD'));
 assert.ok(sql.includes('finance/tenant'));
 assert.ok(!sql.includes('SET LOCAL statement_timeout=\'300s\''));
});
