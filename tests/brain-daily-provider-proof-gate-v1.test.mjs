import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkDailyGrowthSourceTruth} from '../tools/content-growth/daily-provider-proof-gate.mjs';
const now=new Date('2026-10-24T18:00:00Z');
const recentPost={post_id:'brand-post-1',platform:'instagram',provider_quality:'OBSERVED',
 observed_at:'2026-10-24T17:00:00Z',views:53,likes:0,comments:0};
const source={source_state:'READ_ONLY_PROVIDER_OBSERVED',
 social_posts:[recentPost],website_pages:[],
 source_quality:{instagram:{quality:'OBSERVED_LEGACY',observed_at:'2026-10-24T15:00:00Z'},
 website_interactions:{quality:'OBSERVED',observed_at:'2026-10-24T17:30:00Z'},
 search_console:{quality:'AWAITING_PROVIDER'}}};
test('real recent post metrics with valid branded provider evidence pass only for covered channel',()=>{
 const x=checkDailyGrowthSourceTruth(source,{now});
 assert.equal(x.ok,true);
 assert.equal(x.posts_with_recent_observed_metrics,1);
 assert.equal(x.pages_with_recent_consented_human_sessions,0);
 assert.equal(x.partial_coverage,true);
 assert.equal(x.outcome_attribution,'NOT_PROVEN_BY_TRAFFIC_OR_ENGAGEMENT');
});
test('healthy API response with registered but unmeasured posts fails closed',()=>{
 const x=checkDailyGrowthSourceTruth({...source,social_posts:[{post_id:'unmeasured',platform:'linkedin',provider_quality:'MISSING',observed_at:null}]},{now});
 assert.equal(x.ok,false);
 assert.equal(x.code,'NO_RECENT_VERIFIED_POST_OR_WEBSITE_MEASUREMENTS');
 assert.equal(x.registered_posts,1);
});
test('observed comments or reactions of zero count as data only with a fresh verified provider snapshot',()=>{
 const r={...recentPost,views:null,likes:null,comments:0};
 assert.equal(checkDailyGrowthSourceTruth({...source,social_posts:[r]},{now}).ok,true);
 assert.equal(checkDailyGrowthSourceTruth({...source,social_posts:[{...r,observed_at:'2026-10-01T10:00:00Z'}]},{now}).ok,false);
 assert.equal(checkDailyGrowthSourceTruth({...source,social_posts:[{...r,provider_quality:'STALE_PROVIDER'}]},{now}).ok,false);
});
test('consented human website aggregate independently proves website measurement, not customers',()=>{
 const page={path:'/blog/test/',human_page_sessions:23,human_click_sessions:0,observed_at:'2026-10-24T16:00:00Z'};
 const a=checkDailyGrowthSourceTruth({...source,social_posts:[],website_pages:[page]},{now});
 assert.equal(a.ok,true);
 assert.equal(a.pages_with_recent_consented_human_sessions,1);
 assert.equal(a.outcome_attribution,'NOT_PROVEN_BY_TRAFFIC_OR_ENGAGEMENT');
 const expired=checkDailyGrowthSourceTruth({...source,social_posts:[],website_pages:[page],
 source_quality:{website_interactions:{quality:'OBSERVED',observed_at:'2026-10-14T13:00:00Z'}}},{now});
 assert.equal(expired.ok,false);
});
test('no provider readback and invalid clock do not produce false-green',()=>{
 for(const state of ['AUTH_REQUIRED','SOURCE_ERROR','NOT_COLLECTED','PROVIDER_READBACK_PENDING','']){
  assert.equal(checkDailyGrowthSourceTruth({...source,source_state:state},{now}).ok,false);
 }
 assert.equal(checkDailyGrowthSourceTruth(source,{now:'not-a-date'}).code,'INVALID_PROOF_CLOCK');
 assert.equal(checkDailyGrowthSourceTruth({...source,source_quality:{}},{now}).code,'CANONICAL_SOURCE_COVERAGE_MISSING');
});
test('existing daily workflow stays canonical, tests truth independently and retains evidence',()=>{
 const workflow=fs.readFileSync(new URL('../.github/workflows/content-growth-learning.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('node tools/content-growth/daily-provider-proof-gate.mjs /tmp/content-growth-learning.json'));
 assert.ok(workflow.includes('if: always()'));
 assert.ok(workflow.includes('secrets.SUPABASE_ACCESS_TOKEN'));
 assert.equal(workflow.split("cron: '20 4 * * *'").length-1,1);
 const diag=fs.readFileSync(new URL('../tools/content-growth/daily-performance-diagnostics.mjs',import.meta.url),'utf8');
 assert.ok(diag.includes('observed_at:item.observed_at||null,attribution:'));
});