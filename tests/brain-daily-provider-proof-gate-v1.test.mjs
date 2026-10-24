import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkDailyGrowthSourceTruth} from '../tools/content-growth/daily-provider-proof-gate.mjs';
const source={source_state:'READ_ONLY_PROVIDER_OBSERVED',social_posts:[{post_id:'known'}],website_pages:[],source_quality:{instagram:{quality:'OBSERVED'},linkedin:{quality:'OBSERVED_PARTIAL_SCOPE'}}};
test('independent provider readback permits a valid but still partial-scope daily observation',()=>{
 const x=checkDailyGrowthSourceTruth(source);
 assert.equal(x.ok,true);assert.equal(x.post_records,1);assert.equal(x.has_consented_pages,false);
});
test('missing token and failed read are not falsely reported as successful growth learning',()=>{
 for(const state of ['AUTH_REQUIRED','SOURCE_ERROR','NOT_COLLECTED','PROVIDER_READBACK_PENDING','']){
  const result=checkDailyGrowthSourceTruth({...source,source_state:state});
  assert.equal(result.ok,false);assert.equal(result.code,'CANONICAL_SOURCE_NOT_OBSERVED');
 }
 assert.equal(checkDailyGrowthSourceTruth({}).ok,false);
});
test('empty cached or missing source arrays are not mistaken for fresh brand learning',()=>{
 for(const broken of [{...source,social_posts:[]},{...source,source_quality:{}},{...source,social_posts:null}]){
  const x=checkDailyGrowthSourceTruth(broken);
  assert.equal(x.ok,false);assert.equal(x.code,'CANONICAL_SOURCE_COVERAGE_MISSING');
 }
});
test('existing daily workflow checks source truth independently and always retains evidence',()=>{
 const workflow=fs.readFileSync(new URL('../.github/workflows/content-growth-learning.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('node tools/content-growth/daily-provider-proof-gate.mjs /tmp/content-growth-learning.json'));
 assert.ok(workflow.includes('if: always()'));
 assert.ok(workflow.includes("secrets.SUPABASE_ACCESS_TOKEN"));
 assert.equal(workflow.split("cron: '20 4 * * *'").length-1,1);
});
