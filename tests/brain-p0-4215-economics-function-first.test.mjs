import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261020143000_p0_4215_economics_function_first.sql',import.meta.url),'utf8');
test('canonical internal research economics bounded to 50 without indexing under incident load',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_backfill_internal_research_economics_v1/);
 assert.match(sql,/limit 50\s+loop/i);
 assert.match(sql,/not exists/i);
 assert.match(sql,/human_approved/);
 assert.match(sql,/evidence_only/);
 assert.match(sql,/powerhouse_record_action_economics_v1/);
 assert.doesNotMatch(sql,/\bCREATE INDEX\b/i);
 assert.doesNotMatch(sql,/\bcron\.(?:schedule|alter_job|unschedule)\s*\(/i);
 assert.doesNotMatch(sql,/\b(?:DELETE|TRUNCATE|DROP TABLE)\b/i);
});
test('guard fails closed on source drift and avoids unbounded DDL waits',()=>{
 assert.match(sql,/ECONOMICS_ORIGINAL_SOURCE_DRIFT/);
 assert.match(sql,/SET LOCAL lock_timeout = '2s'/);
 assert.match(sql,/SET LOCAL statement_timeout = '12s'/);
});
test('original idempotent economics and server-only authorisation remain intact',()=>{
 for(const s of ['SECURITY DEFINER',"SET search_path TO 'public', 'pg_catalog'","'provider_cost_eur','UNOBSERVED'","'external_cost_eur','UNOBSERVED'","'no_zero_cost_claim',true", 'REVOKE ALL ON FUNCTION','FROM PUBLIC, anon, authenticated','GRANT EXECUTE ON FUNCTION','TO service_role'])assert.ok(sql.includes(s),s);
});
