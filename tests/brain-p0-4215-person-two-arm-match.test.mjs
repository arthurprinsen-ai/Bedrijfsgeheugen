import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261022221500_p0_4215_person_two_arm_match_v1.sql',import.meta.url),'utf8');
test('join branches are disjoint and select most recent person per original opportunity',()=>{
 assert.equal((sql.match(/person_intelligence_cache AS MATERIALIZED/g)||[]).length,1);
 assert.equal((sql.match(/JOIN person_intelligence_cache p1/g)||[]).length,2);
 assert.match(sql,/JOIN person_intelligence_cache p1 ON p1\.person_key=o\.person_key/);
 assert.match(sql,/JOIN person_intelligence_cache p1 ON p1\.linkedin_url=o\.person_key AND p1\.person_key IS DISTINCT FROM o\.person_key/);
 assert.match(sql,/UNION ALL/);
 assert.match(sql,/SELECT DISTINCT ON \(matched_opportunity_id\) \*/);
 assert.match(sql,/ORDER BY matched_opportunity_id,last_relevant_at DESC NULLS LAST/);
 assert.match(sql,/LEFT JOIN person_choice p ON p\.matched_opportunity_id=o\.opportunity_id/);
 assert.doesNotMatch(sql,/LEFT JOIN LATERAL \( SELECT p1\.person_key/);
});
test('transactional versioned migration preserves 50-column view and browser denial',()=>{
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
 assert.match(sql,/SET LOCAL lock_timeout='2s'/);
 assert.match(sql,/6a7a20df1f24b4333986ba9b2da09314/);
 assert.match(sql,/8a9b316a512dcf55889b0a56e7026170/);
 assert.match(sql,/P0_4215_TWO_ARM_PREVIOUS_HASH_DRIFT/);
 assert.match(sql,/P0_4215_TWO_ARM_NEW_HASH_DRIFT/);
 assert.match(sql,/P0_4215_TWO_ARM_COLUMN_DRIFT/);
 assert.match(sql,/P0_4215_TWO_ARM_POSTWRITE_SECURITY_DRIFT/);
 assert.match(sql,/WITH \(security_invoker=true\) AS/);
 assert.doesNotMatch(sql,/\b(?:TRUNCATE|DELETE FROM|INSERT INTO|DROP TABLE|cron\.schedule|cron\.alter_job)\b/i);
});
test('forecast, buying-window and positive expected value formulas are not removed',()=>{
 assert.match(sql,/AS forecast_evidence/);
 assert.match(sql,/AS commercial_progression_probability/);
 assert.match(sql,/round\(GREATEST\(0::numeric, COALESCE\(expected_value_eur/);
 assert.match(sql,/AS expected_commercial_value_eur/);
 assert.match(sql,/FROM scored s;/);
});
test('fixture match-set equivalence covers key, alias, double-hit, null and no match; NOT production parity',()=>{
 const ps=[{person_key:'a',linkedin_url:'alias-a',last_relevant_at:10},{person_key:'a',linkedin_url:'old-a',last_relevant_at:2},{person_key:'b',linkedin_url:'a',last_relevant_at:7},{person_key:null,linkedin_url:'only-url',last_relevant_at:3}];
 const eq=(a,b)=>a!=null&&b!=null&&a===b;
 const old=k=>ps.filter(p=>eq(p.person_key,k)||eq(p.linkedin_url,k)).sort((x,y)=>y.last_relevant_at-x.last_relevant_at)[0]??null;
 const now=k=>[...ps.filter(p=>eq(p.person_key,k)),...ps.filter(p=>eq(p.linkedin_url,k)&&p.person_key!==k)].sort((x,y)=>y.last_relevant_at-x.last_relevant_at)[0]??null;
 for(const k of ['a','alias-a','old-a','only-url','missing',null])assert.deepEqual(now(k),old(k));
});
