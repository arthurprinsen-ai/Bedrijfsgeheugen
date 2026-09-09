import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocialOutcomeHandler } from '../netlify/functions/social-outcome-ingest.mjs';

function req(body, method='POST',token='test-token') { return new Request('https://example.test/api/social-outcome-ingest',{method,headers:{'content-type':'application/json','x-bg-service-token':token},body:method==='POST'?JSON.stringify(body):undefined}); }

const event={eventId:'evt-1',tenantId:'tenant-1',idempotencyKey:'idem-1',platform:'linkedin_personal',externalPostId:'li-1',observedAt:'2026-09-02T10:00:00Z',publishedAt:'2026-09-01T10:00:00Z',source:'linkedin',metrics:{impressions:100,likes:0,comments:3}};

test('unauthenticated ingest fails closed before writes',async()=>{
  let writes=0;
  const handler=createSocialOutcomeHandler({serviceToken:'test-token',persistEvent:async()=>writes++,store:{putPost:async()=>writes++,appendSnapshot:async()=>writes++}});
  const response=await handler(req(event,'POST','wrong-token'));
  assert.equal(response.status,401);
  assert.equal(writes,0);
});

test('ingest persists audit event before analytical snapshot', async()=>{
  const order=[];
  const handler=createSocialOutcomeHandler({serviceToken:'test-token',persistEvent:async()=>{order.push('event');return {status:'RECEIVED'};},store:{putPost:async()=>order.push('post'),appendSnapshot:async()=>order.push('snapshot')}});
  const response=await handler(req(event));
  assert.equal(response.status,202);
  assert.deepEqual(order,['event','post','snapshot']);
});

test('invalid payload is rejected without writes', async()=>{
  let writes=0;
  const handler=createSocialOutcomeHandler({serviceToken:'test-token',persistEvent:async()=>writes++,store:{putPost:async()=>writes++,appendSnapshot:async()=>writes++}});
  const response=await handler(req({eventId:'evt'}));
  assert.equal(response.status,400);
  assert.equal(writes,0);
});

test('GET is not allowed', async()=>{
  const handler=createSocialOutcomeHandler({serviceToken:'test-token',persistEvent:async()=>{},store:{}});
  assert.equal((await handler(req({},'GET'))).status,405);
});
