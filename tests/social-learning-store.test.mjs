import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocialLearningStore } from '../netlify/functions/_social-learning-store.mjs';

function fakeGateway() {
  const calls=[];
  const responses=[];
  const fetchFn=async (url, init)=>{
    calls.push({url,init,body:JSON.parse(init.body)});
    const next=responses.shift() ?? {status:200, body:{ok:true}};
    return {ok:next.status>=200&&next.status<300,status:next.status,json:async()=>next.body};
  };
  return {calls,responses,fetchFn};
}

test('snapshot append uses explicit append action and stable idempotency key', async () => {
  const g=fakeGateway();
  const store=createSocialLearningStore({fetchFn:g.fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'secret'});
  await store.appendSnapshot({snapshotId:'snap-1',postId:'post-1',sourceEventId:'event-1',observedAt:'2026-09-02T10:00:00Z',metrics:{likes:0}});
  assert.equal(g.calls[0].body.action,'append_snapshot');
  assert.equal(g.calls[0].body.snapshot.snapshotId,'snap-1');
  assert.equal(g.calls[0].body.idempotencyKey,'snapshot:snap-1');
});

test('store surfaces conflicts instead of overwriting', async () => {
  const g=fakeGateway();
  g.responses.push({status:409,body:{error:'conflict'}});
  const store=createSocialLearningStore({fetchFn:g.fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'secret'});
  await assert.rejects(()=>store.appendSnapshot({snapshotId:'snap-1',postId:'post-1'}),/conflict/i);
});

test('projection reads last known good payload', async () => {
  const g=fakeGateway();
  g.responses.push({status:200,body:{projection:{version:'v1',learnings:[{learningId:'L1'}]}}});
  const store=createSocialLearningStore({fetchFn:g.fetchFn,baseUrl:'https://example.supabase.co',serviceToken:'secret'});
  const projection=await store.getProjection('tenant-1');
  assert.equal(projection.learnings[0].learningId,'L1');
  assert.equal(g.calls[0].body.action,'get_projection');
});
