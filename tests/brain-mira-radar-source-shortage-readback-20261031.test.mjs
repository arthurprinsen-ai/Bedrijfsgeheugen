import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classifyOriginalMiraSourceResult,MIRA_SOURCE_SHORTAGE_CONTRACT}
 from '../supabase/functions/_shared/mira-radar-source-result.mjs';

const runDate='2026-11-01';
test('source exhaustion is NOT green even when radar HTTP and provider searches succeed',()=>{
 for(const state of ['NO_FRESH_PUBLIC_PROBLEM_SIGNAL','SOURCE_LINEAGE_SIGNAL_MISSING',
  'SOURCE_PUBLICATION_DATE_UNVERIFIED_OR_STALE']){
  const result=classifyOriginalMiraSourceResult({runDate,materialized:{ok:false,state},error:null});
  assert.equal(result.contract,MIRA_SOURCE_SHORTAGE_CONTRACT);
  assert.equal(result.ok,false);
  assert.equal(result.sourceReady,false);
  assert.equal(result.recoveryDue,true);
  assert.equal(result.code,'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED');
  assert.equal(result.reason,state);
 }
});
test('an actual materialized recommendation or already frozen original winner qualifies source stage only',()=>{
 for(const state of ['RECOMMENDATION_MATERIALIZED','WINNER_ALREADY_FROZEN']){
  const r=classifyOriginalMiraSourceResult({runDate,materialized:{ok:true,state}});
  assert.equal(r.ok,true);
  assert.equal(r.sourceReady,true);
  assert.equal(r.recoveryDue,false);
  assert.equal(r.code,null);
  assert.equal('provider_post_id' in r,false);
  assert.equal('published' in r,false);
 }
});
test('unverified, RPC failure, invalid date, malformed and synthetic states fail closed',()=>{
 const cases=[
  {runDate,materialized:null},
  {runDate,materialized:{ok:true,state:'NO_FRESH_PUBLIC_PROBLEM_SIGNAL'}},
  {runDate,materialized:{ok:false,state:'WINNER_ALREADY_FROZEN'}},
  {runDate,materialized:{ok:true,state:'UNKNOWN_STATUS'}},
  {runDate,materialized:{ok:false,state:'SOURCE_REPLAY_APPROVED'}},
  {runDate,materialized:{ok:false,state:'NO_FRESH_PUBLIC_PROBLEM_SIGNAL'},error:{message:'injected-token'}},
  {runDate:'not-a-date',materialized:{ok:true,state:'WINNER_ALREADY_FROZEN'}}
 ];
 for(const item of cases){
  const r=classifyOriginalMiraSourceResult(item);
  assert.equal(r.ok,false);
  assert.equal(r.recoveryDue,true);
  assert.equal(r.code,'MIRA_SOURCE_RESULT_UNVERIFIED');
  assert.doesNotMatch(JSON.stringify(r),/injected-token/);
 }
});
test('original one and only Mira radar persists typed ONE BRAIN observation on source shortage',async()=>{
 const src=await readFile(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
 assert.match(src,/classifyOriginalMiraSourceResult/);
 assert.match(src,/brain_observe_failure/);
 assert.match(src,/mira-radar:source-supply:/);
 assert.match(src,/powerhouse\|mira\|no-new-unique-source-backed-daily-winner/);
 assert.match(src,/ok:errors\.length===0&&supply\.ok/);
 assert.match(src,/status:'RECOVERY_DUE'/);
 assert.match(src,/sendsAuthorized:false/);
 assert.match(src,/powerhouse_materialize_mira_problem_recommendation_v1/);
 assert.doesNotMatch(src,/setInterval\(|cron\.schedule|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/);
});
