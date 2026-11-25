import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueLearningStore} from '../netlify/functions/_revenue-learning-store.mjs';

const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const make=fetchFn=>createRevenueLearningStore({baseUrl:'https://example.supabase.co',serviceToken:'secret',retryDelayMs:0,fetchFn});

test('one transient 503 store timeout is retried once and the run continues',async()=>{
  let calls=0;
  const store=make(async()=>{calls++;return calls===1?response({error:'TimeoutError: Signal timed out.'},503):response({evidence:[{evidenceId:'e1'}]});});
  assert.deepEqual(await store.listDueEvidence('2026-10-27T14:00:00.000Z'),[{evidenceId:'e1'}]);
  assert.equal(calls,2);
});

test('a network failure is retried once, a second failure still rejects',async()=>{
  let calls=0;
  const store=make(async()=>{calls++;throw new TypeError('fetch failed');});
  await assert.rejects(()=>store.getProjection(),/fetch failed/);
  assert.equal(calls,2);
});

test('4xx conflicts and degraded 202 payloads are not retried',async()=>{
  let calls=0;
  const conflict=make(async()=>{calls++;return response({error:'EVIDENCE_CONFLICT'},409);});
  await assert.rejects(()=>conflict.upsertEvidence({evidenceId:'ev1'}),e=>e.status===409);
  assert.equal(calls,1);
  calls=0;
  const degraded=make(async()=>{calls++;return response({candidates:[],degraded:true,reason:'DATA_API_CIRCUIT_OPEN'},202);});
  await assert.rejects(()=>degraded.listProjectionCandidates('now'),e=>e.status===503);
  assert.equal(calls,1);
});

test('retried write keeps the same idempotency key', async()=>{
  const keys=[];
  const store=make(async(url,init)=>{keys.push(JSON.parse(init.body).idempotencyKey);return keys.length===1?response({error:'gateway'},502):response({stored:true});});
  await store.markEvidenceEvaluated('e1','2026-10-27T14:00:00.000Z');
  assert.deepEqual(keys,['evaluated:e1:2026-10-27T14:00:00.000Z','evaluated:e1:2026-10-27T14:00:00.000Z']);
});
