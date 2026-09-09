import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocialLearningContextHandler } from '../netlify/functions/social-learning-context.mjs';

function request(method='GET',body,token='test-token'){return new Request('https://example.test/api/social-learning-context?tenantId=t1',{method,headers:{'content-type':'application/json','x-bg-service-token':token},body:body?JSON.stringify(body):undefined});}

test('context fails closed without valid service token',async()=>{
  let reads=0;
  const handler=createSocialLearningContextHandler({serviceToken:'test-token',store:{listCurrentLearnings:async()=>{reads++;return [];}}});
  const response=await handler(request('GET',undefined,'wrong'));
  assert.equal(response.status,401);
  assert.equal(reads,0);
});

test('GET returns bounded proven current learnings only',async()=>{
  const store={listCurrentLearnings:async()=>[
    {learningId:'L1',status:'PROVEN',confidence:.9,effectSize:.4,lastValidatedAt:'2026-09-08'},
    {learningId:'L2',status:'RETIRED',confidence:.99,effectSize:.7,lastValidatedAt:'2026-09-08'},
    {learningId:'L3',status:'PROVEN',confidence:.8,effectSize:.2,lastValidatedAt:'2026-09-07'}
  ],getProjection:async()=>null,putProjection:async()=>{}};
  const handler=createSocialLearningContextHandler({serviceToken:'test-token',store,maxLearnings:1});
  const response=await handler(request());
  const data=await response.json();
  assert.equal(response.status,200);
  assert.equal(data.learnings.length,1);
  assert.equal(data.learnings[0].learningId,'L1');
});

test('POST records applied and considered learning ids',async()=>{
  let saved;
  const applications=[];
  const store={recordDecision:async d=>{saved=d;return d;},recordApplication:async a=>applications.push(a)};
  const handler=createSocialLearningContextHandler({serviceToken:'test-token',store});
  const response=await handler(request('POST',{tenantId:'t1',decisionId:'d1',postId:'p1',consideredLearningIds:['L1','L2'],appliedLearningIds:['L1'],mode:'EXPLOIT'}));
  assert.equal(response.status,202);
  assert.deepEqual(saved.appliedLearningIds,['L1']);
  assert.equal(applications[0].learningId,'L1');
});
