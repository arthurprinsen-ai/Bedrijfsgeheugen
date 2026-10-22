import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261011163100_reuse_portfolio_learning_scores_p0_4198.sql','utf8');
const rank=sql.slice(sql.indexOf('with ranked as ('),sql.indexOf('  insert into public.powerhouse_sales_actions('));

test('canonical portfolio computation occurs only once and second ranked query reuses the saved per-run scores',()=>{
 assert.equal((sql.match(/from public\.powerhouse_portfolio_allocator_v1/g)||[]).length,1);
 assert.match(rank,/from public\.powerhouse_opportunities s/);
 assert.doesNotMatch(rank,/from public\.powerhouse_portfolio_allocator_v1/);
 assert.match(rank,/commercial_learning_v1,scored_at/);
 assert.match(rank,/::timestamptz=v_now/);
 for(const field of ['portfolio_score_eur','allocation_confidence','modeled_value_eur','economic_buyers','technical_evaluators','champions','source_updated_at']){
   assert.ok(rank.includes('commercial_learning_v1,'+field),field);
 }
});
test('original source timestamp tie break and eligibility selection survive precomputed ranking',()=>{
 assert.match(sql,/'source_updated_at',o\.updated_at/);
 assert.match(rank,/portfolio_score_eur.*\)\s*::numeric>0/s);
 assert.match(rank,/allocation_confidence.*\)\s*::numeric>=0\.20/s);
 assert.match(rank,/row_number\(\) over/);
 assert.match(rank,/where s\.status='open'/);
 assert.match(sql,/where r\.rn<=5/);
 assert.match(sql,/on conflict\(dedupe_key\) do update/);
});
test('auth and delivery remain unchanged; no duplicate scheduler/provider/recipients',()=>{
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_commercial_learning_cycle_v1\(date\)/);
 assert.match(sql,/TO service_role/);
 assert.doesNotMatch(sql,/cron\.(schedule|unschedule|alter_job)|net\.http_post|SALESROBOT_SEND_MESSAGE/i);
 assert.match(sql,/modeled expected value is not realized revenue/);
 assert.match(sql,/existing execution eligibility, destination, identity, consent, dedupe, contact-pressure and provider-readback gates remain mandatory/);
});
