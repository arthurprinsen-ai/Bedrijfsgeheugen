import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const sql=readFileSync('supabase/migrations/20261022222500_p0_4215_person_alias_set_join_fastpath.sql','utf8');
const runner=readFileSync('tests/brain-p0-4215-buying-window-set-join-parity.mjs','utf8');

test('forward-only exact predecessor and post source hash + invoker security boundaries',()=>{
 assert.match(sql,/6a7a20df1f24b4333986ba9b2da09314/);
 assert.match(sql,/dcac5a8d2543147d3d5e294cc14a599e/);
 assert.match(sql,/P0_4215_SETJOIN_PRE_BROWSER_READ_BOUNDARY_DRIFT/);
 assert.match(sql,/P0_4215_SETJOIN_POST_BROWSER_READ_BOUNDARY_DRIFT/);
 assert.match(sql,/P0_4215_SETJOIN_50_COLUMN_SCHEMA_DRIFT/);
 assert.match(sql,/WITH \(security_invoker=true\) AS/);
 assert.match(sql,/REVOKE ALL ON public\.powerhouse_buying_window_v2 FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(sql,/cron\.schedule|cron\.alter_job|\bTRUNCATE\b|\bDELETE FROM\b|\bGRANT\b/i);
 assert.equal((sql.match(/CREATE OR REPLACE VIEW public\.powerhouse_buying_window_v2/g)||[]).length,1);
});

test('single materialization, keyed alias union and one opportunity match',()=>{
 assert.equal((sql.match(/person_intelligence_cache AS MATERIALIZED/g)||[]).length,1);
 assert.match(sql,/person_aliases AS/);
 assert.match(sql,/p1\.linkedin_url IS DISTINCT FROM p1\.person_key/);
 assert.match(sql,/SELECT DISTINCT ON \(o\.opportunity_key\)/);
 assert.match(sql,/LEFT JOIN person_aliases pa ON pa\.match_key = o\.person_key/);
 assert.match(sql,/ORDER BY o\.opportunity_key, pa\.last_relevant_at DESC NULLS LAST/);
 assert.match(sql,/LEFT JOIN person_matches p ON p\.opportunity_key = o\.opportunity_key/);
 assert.doesNotMatch(sql,/LEFT JOIN LATERAL \( SELECT p1\.person_key/);
 assert.match(sql,/AS expected_commercial_value_eur/);
 assert.match(sql,/FROM scored s;/);
});

test('preview full-row 50-column, positive financial and production-denial gates',()=>{
 assert.match(runner,/BEGIN ISOLATION LEVEL REPEATABLE READ/);
 assert.match(runner,/P0_4215_PARITY_ENV/);
 assert.match(runner,/adhjwmvyoixzjtmiroln/);
 assert.match(runner,/EXCEPT ALL/);
 assert.match(runner,/EXPECTED_POSITIVE_FINANCIAL_SCENARIO_REQUIRED/);
 assert.match(runner,/FULL_50_COLUMN_SETJOIN_PARITY_FAILED/);
 assert.match(runner,/ROLLBACK;/);
 assert.match(runner,/P0_4215_SETJOIN_FULL_PARITY_PASSED/);
 assert.doesNotMatch(runner,/\bCOMMIT;/);
});

test('alias-based candidate retains original selection on unique matches, nulls and double-identical alias',()=>{
 const source=[
  {person_key:'p1',linkedin_url:'u1',last_relevant_at:9},
  {person_key:'p2',linkedin_url:'p2',last_relevant_at:4},
  {person_key:'p3',linkedin_url:'u3',last_relevant_at:null}
 ];
 const wanted=['p1','u1','p2','u3','unknown',null];
 const oldMatch=key=>{
  const hit=source.filter(p=>p.person_key===key||p.linkedin_url===key)
    .sort((a,b)=>(b.last_relevant_at??-1)-(a.last_relevant_at??-1));
  return hit[0]?.person_key??null;
 };
 const aliasMap=new Map();
 for(const p of source){
  for(const k of new Set([p.person_key,p.linkedin_url])){
   if(k!==null){const a=aliasMap.get(k)||[];a.push(p);aliasMap.set(k,a);}
  }
 }
 const setMatch=key=>(aliasMap.get(key)||[]).sort((a,b)=>(b.last_relevant_at??-1)-(a.last_relevant_at??-1))[0]?.person_key??null;
 assert.deepEqual(wanted.map(oldMatch),wanted.map(setMatch));
 assert.equal(new Set(wanted).size,wanted.length);
});

test('isolated parity runner rejects execution without explicit preview',()=>{
 const x=spawnSync(process.execPath,['tests/brain-p0-4215-buying-window-set-join-parity.mjs'],{
  env:{...process.env,P0_4215_PARITY_ENV:'',P0_4215_PREVIEW_PROJECT_REF:'',P0_4215_PREVIEW_DATABASE_URL:''},
  encoding:'utf8',timeout:5000
 });
 assert.equal(x.status,1);
 assert.match(x.stderr,/P0_4215_SETJOIN_FULL_PARITY_BLOCKED: isolated preview required/);
});
