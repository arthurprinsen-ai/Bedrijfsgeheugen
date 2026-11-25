import test from 'node:test';
import assert from 'node:assert/strict';
import {runEvaluation,runScheduledTenants,selectDueEvaluationBatch} from '../netlify/functions/social-learning-evaluate.mjs';
const base=new Date('2026-10-24T08:00:00Z');
const old=Array.from({length:12},(_,i)=>({postId:'old'+String(i).padStart(2,'0'),publishedAt:'2026-09-01T08:00:00Z',dueWindow:24}));
const fresh=[{postId:'fresh',publishedAt:'2026-10-23T08:00:00Z',dueWindow:24}];
test('bounded evaluator chooses fresh post plus bounded historical backlog and rotates over time',()=>{
 const a=selectDueEvaluationBatch([...old,...fresh],{now:base,limit:2});
 const b=selectDueEvaluationBatch([...old,...fresh],{now:new Date(base.getTime()+3600000),limit:2});
 assert.equal(a.length,2);assert.equal(b.length,2);
 assert.equal(a[0].postId,'fresh');assert.equal(b[0].postId,'fresh');
 assert.notEqual(a[1].postId,b[1].postId);
 assert.equal(selectDueEvaluationBatch([...old,...fresh],{now:base,limit:100}).length,8);
});
test('scheduled evaluation runs both existing tenant scopes with separate stores and no new scheduler',async()=>{
 const called=[];
 const storeFactory=({tenantId})=>{called.push(tenantId);return {
  listDuePosts:async()=>[],getSnapshots:async()=>{throw Error('no posts due');}
 };};
 const out=await runScheduledTenants({storeFactory,now:base,maxDuePosts:2});
 assert.deepEqual(called,['canonical','bedrijfsgeheugen']);
 assert.equal(out.totals.evaluated,0);
 assert.equal(out.totals.dueBacklog,0);
 assert.equal(out.healthy,true);
});
test('missing historical window does not become a fabricated zero or cause hourly unbounded replay',async()=>{
 const obligations=[];
 const store={listDuePosts:async()=>[...old,...fresh],getSnapshots:async()=>[],
  recordObligation:async x=>obligations.push(x),putEvaluation:async()=>{throw Error('never evaluate absent snapshots');}};
 const out=await runEvaluation({store,now:base,maxDuePosts:2});
 assert.equal(out.attempted,2);
 assert.equal(out.unprocessedDue,11);
 assert.equal(out.missedObligations,2);
 assert.equal(out.evaluated,0);
 assert.equal(obligations.length,2);
});
test('cross-tenant evaluation is rejected instead of reading an unscoped customer stream',async()=>{
 await assert.rejects(runScheduledTenants({tenants:['other-client'],storeFactory:()=>({})}),/UNAUTHORIZED_SOCIAL_TENANT_SCOPE/);
});