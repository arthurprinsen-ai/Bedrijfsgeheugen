import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrainServiceIngestClient } from '../brain/operating-loop/service-ingest-client.mjs';

test('service ingest client posts idempotent canonical records with bearer auth', async () => {
  const calls=[];
  const fetchImpl=async (url,options)=>{
    calls.push({url,options});
    return new Response(JSON.stringify({duplicate:false,record:{id:'state-1'}}),{status:201,headers:{'content-type':'application/json'}});
  };
  const client=createBrainServiceIngestClient({endpoint:'https://example.test/api/brain-operating-ingest',token:'secret-token',fetchImpl});
  const result=await client.post({tenantId:'caller-must-not-control',type:'CurrentState',id:'state-1',source:'make'},{idempotencyKey:'make:state-1'});

  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://example.test/api/brain-operating-ingest');
  assert.equal(calls[0].options.method,'POST');
  assert.equal(calls[0].options.headers.authorization,'Bearer secret-token');
  const body=JSON.parse(calls[0].options.body);
  assert.equal(body.idempotencyKey,'make:state-1');
  assert.equal(body.id,'state-1');
  assert.equal(result.record.id,'state-1');
  assert.equal(JSON.stringify(result).includes('secret-token'),false);
});

test('service ingest client fails closed without endpoint token idempotency or fetch', async () => {
  assert.throws(()=>createBrainServiceIngestClient({token:'x'}),/endpoint/i);
  assert.throws(()=>createBrainServiceIngestClient({endpoint:'https://example.test'}),/token/i);
  assert.throws(()=>createBrainServiceIngestClient({endpoint:'https://example.test',token:'x',fetchImpl:null}),/fetch/i);
  const client=createBrainServiceIngestClient({endpoint:'https://example.test',token:'x',fetchImpl:async()=>new Response('{}',{status:201,headers:{'content-type':'application/json'}})});
  await assert.rejects(()=>client.post({id:'x'}),/idempotency/i);
});

test('service ingest failure exposes status and server error but never bearer token', async () => {
  const client=createBrainServiceIngestClient({
    endpoint:'https://example.test',
    token:'super-secret',
    fetchImpl:async()=>new Response(JSON.stringify({error:'SERVICE_SOURCE_MISMATCH'}),{status:403,headers:{'content-type':'application/json'}})
  });
  await assert.rejects(async()=>client.post({id:'x'},{idempotencyKey:'k'}),error=>{
    assert.equal(error.code,'BRAIN_INGEST_FAILED');
    assert.equal(error.status,403);
    assert.equal(error.serverError,'SERVICE_SOURCE_MISMATCH');
    assert.equal(String(error.message).includes('super-secret'),false);
    return true;
  });
});
