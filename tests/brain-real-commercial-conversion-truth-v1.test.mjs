import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sql=readFileSync(resolve(root,'supabase/migrations/20261009190000_fix_noncommercial_conversion_projection_v1.sql'),'utf8');
test('fail closed for internal operations before cycle or value attribution',()=>{
 assert.match(sql,/coalesce\(new\.revenue_eur,0\)<=0/);
 assert.match(sql,/coalesce\(lower\(new\.outcome_type\),'\'\)/);
 assert.match(sql,/return new;/);
 assert.ok(sql.indexOf("coalesce(new.revenue_eur,0)<=0")<sql.indexOf("v_cycle := public.powerhouse_advance_sales_action_v1"));
 assert.match(sql,/scan_submitted/);
 assert.doesNotMatch(sql,/drop trigger/i);
});
test('historical correction is source-scoped and idempotent, raw audit preserved',()=>{
 assert.match(sql,/DELETE FROM public\.growth_outcomes go/);
 assert.match(sql,/go\.source='powerhouse_sales_outcomes'/);
 assert.match(sql,/DELETE FROM public\.powerhouse_realized_values rv/);
 assert.match(sql,/rv\.source_entity_type='sales_outcome'/);
 assert.match(sql,/so\.outcome_id::text/);
 assert.match(sql,/coalesce\(so\.revenue_eur,0\)=0/);
 assert.doesNotMatch(sql,/DELETE FROM public\.powerhouse_sales_outcomes/i);
 assert.doesNotMatch(sql,/DELETE FROM public\.powerhouse_cycle_events/i);
 assert.match(sql,/removed_false_growth_leads/);
});
