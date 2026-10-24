import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tagDuePostsWithObservedWindows} from '../supabase/functions/_shared/social-learning-due-evidence.mjs';
import {selectDueEvaluationBatch} from '../netlify/functions/social-learning-evaluate.mjs';
const now=new Date('2026-10-24T16:00:00Z');
const posts=[
 {postId:'observed-new',tenantId:'bedrijfsgeheugen',publishedAt:'2026-10-04T08:00:00Z',dueWindow:24},
 {postId:'observed-old',tenantId:'bedrijfsgeheugen',publishedAt:'2026-09-21T08:00:00Z',dueWindow:48},
 {postId:'missing-old',tenantId:'bedrijfsgeheugen',publishedAt:'2026-09-01T08:00:00Z',dueWindow:72},
 {postId:'unverified',tenantId:'bedrijfsgeheugen',publishedAt:'2026-09-22T08:00:00Z',dueWindow:24}
];
const snapshots=[
 {post_id:'observed-new',observed_at:'2026-10-05T10:00:00Z',data_quality:'OBSERVED'},
 {post_id:'observed-old',observed_at:'2026-09-23T06:00:00Z',data_quality:'OBSERVED'},
 {post_id:'unverified',observed_at:'2026-09-23T08:00:00Z',data_quality:'OBSERVED_PARTIAL_SCOPE'},
 {post_id:'missing-old',observed_at:'2026-10-24T13:00:00Z',data_quality:'OBSERVED'}
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
 assert.ok(source.includes("select('post_id,observed_at,data_quality').eq('tenant_id',tenantId)"));
 assert.ok(source.includes("limit(900)"));
 assert.ok(source.includes("COVERAGE_TRUNCATED_FALLBACK"));
 assert.equal(runner.split("schedule:'@hourly'").length-1,1);
 assert.ok(runner.includes("runScheduledTenants"));
});
