import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueLearningStore} from '../netlify/functions/_revenue-learning-store.mjs';

const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

test('store sends existing service token and stable evidence idempotency key',async()=>{
  let call;
  const store=createRevenueLearningStore({baseUrl:'https://example.supabase.co',serviceToken:'secret',fetchFn:async(url,init)=>{call={url,init};return response({stored:true});}});
  await store.upsertEvidence({evidenceId:'ev1',contentId:'c1'});
  assert.equal(call.init.headers['x-bg-service-token'],'secret');
  const body=JSON.parse(call.init.body);
  assert.equal(body.idempotencyKey,'evidence:ev1');
  assert.equal(body.action,'upsert_evidence');
});

test('store returns last-known-good projection payload',async()=>{
  const store=createRevenueLearningStore({baseUrl:'https://example.supabase.co',serviceToken:'secret',fetchFn:async()=>response({projection:{version:'v1',learnings:[1]}})});
  assert.deepEqual(await store.getProjection(),{version:'v1',learnings:[1]});
});

test('store surfaces gateway conflicts',async()=>{
  const store=createRevenueLearningStore({baseUrl:'https://example.supabase.co',serviceToken:'secret',fetchFn:async()=>response({error:'EVIDENCE_CONFLICT'},409)});
  await assert.rejects(()=>store.upsertEvidence({evidenceId:'ev1'}),e=>e.status===409);
});
