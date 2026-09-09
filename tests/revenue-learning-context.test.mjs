import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueLearningContextHandler} from '../netlify/functions/revenue-learning-context.mjs';

const req=(method='GET',body=null,token='secret')=>new Request('https://example.test/api/revenue-learning-context',{method,headers:{'content-type':'application/json','x-bg-service-token':token},body:body?JSON.stringify(body):undefined});

test('context fails closed without service token',async()=>{
  const handler=createRevenueLearningContextHandler({serviceToken:'secret',store:{}});
  const response=await handler(req('GET',null,''));
  assert.equal(response.status,401);
});

test('context returns at most eight proven learnings ordered by commercial value and confidence',async()=>{
  const learnings=Array.from({length:12},(_,i)=>({learningId:`l${i}`,status:i===11?'TESTING':'PROVEN',confidence:.8,effectSize:i/10,effectMetric:'revenue'}));
  const store={listCurrentLearnings:async()=>learnings,putProjection:async()=>{},getProjection:async()=>null};
  const handler=createRevenueLearningContextHandler({serviceToken:'secret',store,now:()=>new Date('2026-09-09T00:00:00Z')});
  const response=await handler(req());const body=await response.json();
  assert.equal(body.learnings.length,8);
  assert.equal(body.learnings[0].learningId,'l10');
  assert.ok(body.learnings.every(l=>l.status==='PROVEN'));
});

test('POST records decision and applied learning applications',async()=>{
  const decisions=[],apps=[];
  const store={recordDecision:async d=>decisions.push(d),recordApplication:async a=>apps.push(a)};
  const handler=createRevenueLearningContextHandler({serviceToken:'secret',store,now:()=>new Date('2026-09-09T00:00:00Z')});
  const response=await handler(req('POST',{decisionId:'d1',contentId:'blog:/x',channel:'blog',appliedLearningIds:['l1','l2']}));
  assert.equal(response.status,202);
  assert.equal(decisions[0].contentId,'blog:/x');
  assert.deepEqual(apps.map(a=>a.learningId),['l1','l2']);
});

test('GET falls back to stored projection when live lookup fails',async()=>{
  const store={listCurrentLearnings:async()=>{throw new Error('down')},getProjection:async()=>({version:'old',learnings:[{learningId:'l1',status:'PROVEN'}]})};
  const handler=createRevenueLearningContextHandler({serviceToken:'secret',store});
  const response=await handler(req());const body=await response.json();
  assert.equal(response.headers.get('x-bg-projection-stale'),'true');
  assert.equal(body.learnings[0].learningId,'l1');
});
