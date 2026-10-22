import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path='supabase/migrations/20261022120800_p0_4215_person_intelligence_once.sql';
const sql=readFileSync(path,'utf8');
const view=sql.split('CREATE OR REPLACE VIEW public.powerhouse_buying_window_v2 WITH (security_invoker=true) AS')[1]?.split('\nDO $readback$')[0];
test('one unchanged canonical person intelligence is materialized once per snapshot',()=>{
 assert.ok(view,'view SQL must exist');
 assert.equal((view.match(/person_intelligence_cache AS MATERIALIZED/g)||[]).length,1);
 assert.equal((view.match(/FROM person_intelligence_cache p1/g)||[]).length,1);
 assert.doesNotMatch(view,/FROM powerhouse_person_intelligence_v1 p1/);
 assert.match(view,/ORDER BY p1\.last_relevant_at DESC NULLS LAST/);
 assert.match(view,/p1\.person_key = o\.person_key OR p1\.linkedin_url = o\.person_key/);
 assert.match(view,/LIMIT 1\) p ON true/);
 assert.match(view,/WITH person_intelligence_cache AS MATERIALIZED \(SELECT \* FROM public\.powerhouse_person_intelligence_v1\), base AS/);
});
test('same 50-column buying-window output and matching financial formula',()=>{
 assert.match(view,/round\(GREATEST\(0::numeric, COALESCE\(expected_value_eur, 0::numeric\) \* buying_window_score_raw \* buying_window_confidence_raw\), 2\) AS expected_commercial_value_eur/);
 assert.match(view,/AS commercial_progression_probability/);
 assert.match(view,/forecast_id/);
 assert.match(view,/FROM scored s;/);
 assert.match(sql,/P0_4215_BUYING_VIEW_COLUMN_COUNT_CHANGED/);
});
test('strict original view/source/tenant security contract retained',()=>{
 assert.match(sql,/2ce1ab1122390af0f51c5aa8b318600f/);
 assert.match(sql,/P0_4215_BUYING_VIEW_BASE_SOURCE_DRIFT/);
 assert.match(sql,/P0_4215_SECURITY_INVOKER_MISSING/);
 assert.match(sql,/P0_4215_BROWSER_READ_BOUNDARY_DRIFT/);
 assert.match(sql,/P0_4215_BROWSER_READ_POSTWRITE_MISMATCH/);
 assert.match(sql,/SET LOCAL lock_timeout='2s'/);
 assert.match(sql,/SET LOCAL statement_timeout='15s'/);
 assert.doesNotMatch(sql,/\bGRANT\s+|\bTRUNCATE\s+|\bDELETE FROM\s+|\bINSERT INTO\s+|cron\.alter_job\s*\(/i);
});
test('view migration only changes person intelligence use, never dispatch',()=>{
 assert.doesNotMatch(sql,/CREATE\s+(?:FUNCTION|TABLE|TRIGGER)|\bCALL\s+|cron\.schedule|\bDROP\s+TABLE|\bALTER\s+ROLE/i);
 assert.match(sql,/BEGIN;/);
 assert.match(sql,/COMMIT;/);
});

test('independent preview runner compares every 50-column row, forecast aggregation and rejects production',()=>{
 const p='tests/brain-p0-4215-buying-window-full-parity.mjs';
 const src=readFileSync(p,'utf8');
 assert.match(src,/P0_4215_PARITY_ENV/);
 assert.match(src,/isolated-preview/);
 assert.match(src,/productionRef='adhjwmvyoixzjtmiroln'/);
 assert.match(src,/ALL_50_COLUMN_SCHEMA_PARITY_FAILED/);
 assert.match(src,/BUYING_ALL_50_COLUMN_BIDIRECTIONAL_PARITY_FAILED/);
 assert.match(src,/BUYING_FINANCIAL_AGGREGATE_PARITY_FAILED/);
 assert.match(src,/EXCEPT ALL/);
 assert.match(src,/BEGIN ISOLATION LEVEL REPEATABLE READ/);
 assert.match(src,/ROLLBACK;/);
 assert.match(src,/CREATE TEMP TABLE p0_old/);
 assert.match(src,/CREATE TEMP VIEW p0_4215_buying_candidate/);
 assert.doesNotMatch(src,/CREATE OR REPLACE VIEW public\.powerhouse_buying_window_v2 WITH/);
});
