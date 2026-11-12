import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const relative='../supabase/migrations/';
const sql=readFileSync(new URL(relative+'20261112220000_original_seo_derived_ninth_source_guard_v1.sql',import.meta.url),'utf8');
const derived=readFileSync(new URL(relative+'20261112214500_original_seo_derived_brain_manifest_handoff_v1.sql',import.meta.url),'utf8');
test('one original derived source makes nine archive rows; guard only changes the expected count',()=>{
 assert.match(derived,/SELECT 'seo_opportunity_intelligence'/);
 assert.match(derived,/SELECT 'technical_seo_audit'/);
 assert.match(sql,/v_old constant text := 'v_saved<>8'/);
 assert.match(sql,/v_new constant text := 'v_saved<>9'/);
 assert.match(sql,/replace\(v_before,v_old,v_new\)/);
 assert.match(sql,/pg_get_functiondef\('public\.powerhouse_daily_source_archive_v1\(date\)'::regprocedure\)/);
 assert.match(sql,/SEO_ORIGINAL_NINE_SOURCE_GUARD_PRECONDITION_FAILED/);
 assert.match(sql,/SEO_ORIGINAL_NINE_SOURCE_GUARD_READBACK_FAILED/);
});
test('original single writer and source→Brain/Heartbeat handoff are preserved',()=>{
 assert.doesNotMatch(sql,/\b(?:cron\.schedule|net\.http_post|INSERT\s+INTO|UPDATE\s+public\.|DELETE\s+FROM|GRANT\s+EXECUTE|CREATE\s+TABLE)\b/i);
 assert.match(sql,/v_after:=replace\(v_before,v_old,v_new\)/);
 assert.match(sql,/EXECUTE v_after/);
 assert.match(sql,/MISSING_DERIVED_SEO_OPPORTUNITY/);
 assert.match(sql,/DERIVED_SEO_OPPORTUNITY_OBSERVED/);
});
