import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shortenMarketKeyword,dataforseoRecoveryPlan,isRecentFailedSourceTopic}
  from '../supabase/functions/bg-externe-signalen/provider-recovery.mjs';

const original='skills vaardigheden opleidingen certificeringen AI literacy management arbeidsmarkt Nederland';
test('DataForSEO 40101 retried once with deterministic narrower public market query',()=>{
 const plan=dataforseoRecoveryPlan({httpStatus:200,statusCode:40101,keyword:original});
 assert.deepEqual(plan,{retry:true,reason:'SEARCH_ENGINE_RETRY_SHORT_QUERY',
  keyword:'skills vaardigheden opleidingen certificeringen AI Nederland'});
 assert.ok(plan.keyword.length<original.length);
});
test('provider execution failure 40103 has bounded recovery, never fabricated results',()=>{
 const plan=dataforseoRecoveryPlan({httpStatus:200,statusCode:40103,keyword:original});
 assert.equal(plan.retry,true);
 assert.equal(plan.reason,'SEARCH_ENGINE_RETRY_SHORT_QUERY');
 assert.equal(typeof plan.keyword,'string');
});
test('HTTP and provider 5xx are transient while search task response is not assumed success',()=>{
 for(const statusCode of [50000,50301,50302,50303,50401,50402]){
  const x=dataforseoRecoveryPlan({statusCode,httpStatus:200,keyword:original});
  assert.equal(x.retry,true);
  assert.equal(x.keyword,original);
 }
 assert.equal(dataforseoRecoveryPlan({httpStatus:503,statusCode:0,keyword:original}).retry,true);
});
test('provider billing, auth and bad input must never be retried automatically',()=>{
 for(const statusCode of [40000,40100,40104,40200,40505,40506]){
  assert.equal(dataforseoRecoveryPlan({httpStatus:200,statusCode,keyword:original}).retry,false);
 }
 for(const httpStatus of [401,402,403]){
  assert.equal(dataforseoRecoveryPlan({httpStatus,statusCode:0,keyword:original}).retry,false);
 }
 assert.equal(dataforseoRecoveryPlan({statusCode:40102,keyword:original}).retry,false);
});
test('targeted replay only when latest canonical producer evidence says topic failed',()=>{
 const failed={evidence:{producer_run:true,selected_topics:['Skills en capabilities','Andere'],
  source_routes:[{topic:'Andere',provider:'dataforseo'}],failed_topics:1}};
 const recovered={evidence:{producer_run:true,selected_topics:['Skills en capabilities'],
  source_routes:[{topic:'Skills en capabilities',provider:'dataforseo'}],failed_topics:0}};
 assert.equal(isRecentFailedSourceTopic([failed],'Skills en capabilities'),true);
 assert.equal(isRecentFailedSourceTopic([recovered,failed],'Skills en capabilities'),false);
 assert.equal(isRecentFailedSourceTopic([failed],'Andere'),false);
 assert.equal(isRecentFailedSourceTopic([failed],'Niet bestaand'),false);
 assert.equal(isRecentFailedSourceTopic([], 'Skills en capabilities'),false);
});
test('existing authenticated collector scopes replay to one failed topic, preserves organic provenance',async()=>{
 const code=await readFile(new URL('../supabase/functions/bg-externe-signalen/index.ts',import.meta.url),'utf8');
 assert.match(code,/req\.headers\.get\('x-powerhouse-token'\)!==expected/);
 assert.match(code,/isRecentFailedSourceTopic\(recent,retryTopic\)/);
 assert.match(code,/selected=\[active\]/);
 assert.match(code,/gte\('observed_at',new Date\(Date\.now\(\)-24\*3600000\)\.toISOString\(\)\)/);
 assert.match(code,/at most ONE additional provider request/i);
 assert.match(code,/x\.type==='organic'/);
 assert.match(code,/provider_recovery:x\.provider_recovery/);
 assert.match(code,/failed_routes:failed\.map/);
 assert.match(code,/selection_contract:retryTopic\?/);
 assert.match(code,/return json\(out,ok\.length\?\(failed\.length\?207:200\):502\)/);
});
