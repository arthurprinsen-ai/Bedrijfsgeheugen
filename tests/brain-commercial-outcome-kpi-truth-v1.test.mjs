import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sql=readFileSync(resolve(root,'supabase/migrations/20261009193000_filter_real_commercial_outcome_kpis_v1.sql'),'utf8');
test('full-cycle outcome KPI only counts genuine qualified steps or positive verified revenue',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_full_cycle_production_proof/);
 assert.match(sql,/into v_outcomes_90d,v_revenue_90d from public\.powerhouse_sales_outcomes\s+where coalesce\(revenue_eur,0\)>0 or lower\(outcome_type\) in/);
});
test('autonomous growth KPI mirrors same commercial truth boundary',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_autonomous_growth_revenue_cycle/);
 assert.match(sql,/p_run_date - 90\s+and \(coalesce\(revenue_eur,0\)>0 or lower\(outcome_type\) in/);
 assert.match(sql,/lower\(so\.outcome_type\) not in \('not_executed','execution_completed','no_response','no_reply_observed'\)/);
});
test('retains original security and avoids a new scheduler or writer',()=>{
 assert.match(sql,/SECURITY DEFINER/);
 assert.doesNotMatch(sql,/CREATE TRIGGER|cron\.schedule|DROP TABLE/i);
 assert.match(sql,/powerhouse_full_cycle_production_proof/);
 assert.match(sql,/powerhouse_autonomous_growth_revenue_cycle/);
});
