import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tagDuePostsWithObservedWindows,originalBoundWindowSnapshot} from '../supabase/functions/_shared/social-learning-due-evidence.mjs';
import {selectDueEvaluationBatch} from '../netlify/functions/social-learning-evaluate.mjs';
const now=new Date('2026-10-24T16:00:00Z');
const posts=[
 {postId:'observed-new',externalPostId:'observed-new',tenantId:'bedrijfsgeheugen',publishedAt:'2026-10-04T08:00:00Z',dueWindow:24},
 {postId:'observed-old',externalPostId:'observed-old',tenantId:'bedrijfsgeheugen',publishedAt:'2026-09-21T08:00:00Z',dueWindow:48},
 {postId:'missing-old',externalPostId:'missing-old',tenantId:'bedrijfsgeheugen',publishedAt:'2026-09-01T08:00:00Z',dueWindow:72},
 {postId:'unverified',externalPostId:'unverified',tenantId:'bedrijfsgeheugen',publishedAt:'2026-09-22T08:00:00Z',dueWindow:24}
];
const snapshots=[
 {tenant_id:'bedrijfsgeheugen',post_id:'observed-new',source:'buffer',source_event_id:'buffer:observed-new:2026-10-05',
  observed_at:'2026-10-05T10:00:00Z',data_quality:'OBSERVED',metrics:{reach:18}},
 {tenant_id:'bedrijfsgeheugen',post_id:'observed-old',source:'buffer',source_event_id:'buffer:observed-old:2026-09-23',
  observed_at:'2026-09-23T06:00:00Z',data_quality:'OBSERVED',metrics:{Reach:0}},
 {tenant_id:'bedrijfsgeheugen',post_id:'unverified',source:'buffer',source_event_id:'buffer:unverified:2026-09-23',
  observed_at:'2026-09-23T08:00:00Z',data_quality:'OBSERVED_PARTIAL_SCOPE'},
 {tenant_id:'bedrijfsgeheugen',post_id:'missing-old',source:'buffer',source_event_id:'buffer:missing-old:2026-10-24',
  observed_at:'2026-10-24T13:00:00Z',data_quality:'OBSERVED',metrics:{}}
];
test('only actual observations in the exact 24/48/72h interval earn provider evidence hints',()=>{
 const p=tagDuePostsWithObservedWindows(posts,snapshots);
 assert.deepEqual(p.map(x=>x.hasWindowSnapshot),[true,true,false,false]);
 assert.ok(p.every(x=>!Object.hasOwn(x,'metrics')));
});
test('existing hourly evaluator prioritizes independently timed snapshots instead of only empty old debt',()=>{
 const p=tagDuePostsWithObservedWindows(posts,snapshots);
 const selected=selectDueEvaluationBatch(p,{now:new Date(now.getTime()+3600000),limit:2});
 assert.equal(selected.length,2);
 assert.ok(selected.some(x=>x.postId==='observed-new'));
 assert.ok(selected.every(x=>x.hasWindowSnapshot===true));
});
test('missing windows continue to be processed in a bounded periodic rotation',()=>{
 const p=tagDuePostsWithObservedWindows(posts,snapshots);
 const hours=[0,1,2,3].map(i=>new Date(now.getTime()+i*3600000));
 assert.ok(hours.some(t=>selectDueEvaluationBatch(p,{now:t,limit:2}).some(x=>x.hasWindowSnapshot===false)));
});
test('without source evidence keep old bounded absent-snapshot obligations, never invent a result',()=>{
 const onlyMissing=tagDuePostsWithObservedWindows(posts,[]);
 assert.ok(selectDueEvaluationBatch(onlyMissing,{now,limit:2}).every(x=>x.hasWindowSnapshot===false));
 assert.ok(selectDueEvaluationBatch([], {now}).length===0);
});
test('new window data index keeps one existing store/action/scheduler, tenant filter and 900 row guard',()=>{
 const source=fs.readFileSync(new URL('../supabase/functions/social-learning-store/index.ts',import.meta.url),'utf8');
 const runner=fs.readFileSync(new URL('../netlify/functions/social-learning-evaluate.mjs',import.meta.url),'utf8');
 assert.ok(source.includes("select('tenant_id,post_id,observed_at,data_quality,source,source_event_id,metrics').eq('tenant_id',tenantId)"));
 assert.ok(source.includes("limit(900)"));
 assert.ok(source.includes("COVERAGE_TRUNCATED_FALLBACK"));
 assert.equal(runner.split("schedule:'@hourly'").length-1,1);
 assert.ok(runner.includes("runScheduledTenants"));
});

test('verified Windsor company post windows are prioritized only with matching immutable provider identity',()=>{
 const id='urn:li:share:12345';
 const linked={tenant_id:'bedrijfsgeheugen',post_id:'company-post',observed_at:'2026-10-05T10:00:00Z',
   data_quality:'PROVIDER_OBSERVED_LINKED',source:'windsor-linkedin-company',
   source_event_id:'windsor:linkedin-company:'+id+':2026-10-05',
   metrics:{impressions:4,scope:'company_post_analytics',provider_post_urn:id,
     provider_organization_urn:'urn:li:organization:18234216',
     independent_proof:'EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT',
     source_quality_before_link:'PROVIDER_OBSERVED'}};
 const due=[{postId:'company-post',tenantId:'bedrijfsgeheugen',externalPostId:id,publishedAt:'2026-10-04T08:00:00Z',dueWindow:24}];
 assert.equal(tagDuePostsWithObservedWindows(due,[linked])[0].hasWindowSnapshot,true);
 assert.equal(tagDuePostsWithObservedWindows(due,[{...linked,metrics:{...linked.metrics,provider_post_urn:'wrong'}}])[0].hasWindowSnapshot,false);
 assert.equal(tagDuePostsWithObservedWindows(due,[{...linked,data_quality:'OBSERVED_PARTIAL_SCOPE'}])[0].hasWindowSnapshot,false);
});

test('metadata-only OBSERVED within a matching time window is not a valid evidence hint',()=>{
 const empty={tenant_id:'bedrijfsgeheugen',post_id:'observed-new',source:'buffer',source_event_id:'buffer:observed-new:2026-10-05',observed_at:'2026-10-05T10:00:00Z',data_quality:'OBSERVED',metrics:{}};
 const invalid=tagDuePostsWithObservedWindows(posts,[empty]);
 assert.equal(invalid[0].hasWindowSnapshot,false);
 const nullValue=tagDuePostsWithObservedWindows(posts,[{...empty,metrics:{reach:null}}]);
 assert.equal(nullValue[0].hasWindowSnapshot,false);
 const zero=tagDuePostsWithObservedWindows(posts,[{...empty,metrics:{reach:0}}]);
 assert.equal(zero[0].hasWindowSnapshot,true);
});

test('a timed numeric snapshot from wrong tenant/post/provider is not a candidate for the original hourly eval',()=>{
 const post=posts[0],valid=snapshots[0];
 assert.equal(originalBoundWindowSnapshot(post,valid),true);
 for(const invalid of [
  {...valid,tenant_id:'canonical'},
  {...valid,post_id:'unrelated'},
  {...valid,source_event_id:'buffer:unrelated-provider:2026-10-05'},
  {...valid,source_event_id:'buffer:observed-new-extra:2026-10-05'},
  {...valid,source_event_id:''},
  {...valid,source:''},
  {...valid,metrics:{reach:null}},
  {...valid,data_quality:'OBSERVED_PARTIAL_SCOPE'}
 ]){
  assert.equal(tagDuePostsWithObservedWindows([post],[invalid])[0].hasWindowSnapshot,false);
 }
 assert.equal(tagDuePostsWithObservedWindows([post],[valid])[0].hasWindowSnapshot,true);
});

test('seven-hour-old snapshot is NEVER 24h window proof even with a caller requesting tolerance 12',()=>{
 const post=posts[0];
 const offset7={...snapshots[0],observed_at:'2026-10-05T15:00:00Z'};
 assert.equal(tagDuePostsWithObservedWindows([post],[offset7],{toleranceHours:12})[0].hasWindowSnapshot,false);
 const offset6={...snapshots[0],observed_at:'2026-10-05T14:00:00Z'};
 assert.equal(tagDuePostsWithObservedWindows([post],[offset6],{toleranceHours:12})[0].hasWindowSnapshot,true);
 assert.equal(tagDuePostsWithObservedWindows([post],[offset6],{toleranceHours:0})[0].hasWindowSnapshot,false);
 assert.equal(tagDuePostsWithObservedWindows([post],[snapshots[0]],{toleranceHours:0})[0].hasWindowSnapshot,false);
});

test('source-less historical synthetic event never receives original provider priority',()=>{
 const post=posts[0];
 for(const invalidPost of [
  {...post,externalPostId:null},
  {...post,tenantId:'different-tenant'},
  {...post,postId:'different-original-post'}
 ])assert.equal(tagDuePostsWithObservedWindows([invalidPost],snapshots)[0].hasWindowSnapshot,false);
});
