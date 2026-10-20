import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRevenueLearningStore} from '../netlify/functions/_revenue-learning-store.mjs';

const createStore=(reply,status=200)=>createRevenueLearningStore({
  fetchFn:async()=>new Response(JSON.stringify(reply),{status,headers:{'content-type':'application/json'}}),
  baseUrl:'https://example.supabase.co',
  serviceToken:'unit-test-token',
  tenantId:'canonical'
});

test('provider 202 degraded never becomes an empty successful revenue projection',async()=>{
  await assert.rejects(
    createStore({candidates:[],degraded:true,reason:'DATA_API_CIRCUIT_OPEN'},202)
      .listProjectionCandidates('2026-10-20T11:00:00Z'),
    /Revenue learning store degraded: DATA_API_CIRCUIT_OPEN \(202\)/
  );
});

test('legitimate empty projection remains successful while 503 is rejected',async()=>{
  assert.deepEqual(await createStore({candidates:[]},200).listProjectionCandidates('2026-10-20T11:00:00Z'),[]);
  await assert.rejects(
    createStore({error:'PROJECTION_STORE_UNAVAILABLE'},503).listProjectionCandidates('2026-10-20T11:00:00Z'),
    /PROJECTION_STORE_UNAVAILABLE \(503\)/
  );
});

test('bounded Supabase source declares both read breakers and limits queried rows',()=>{
  const src=readFileSync(new URL('../supabase/functions/revenue-learning-store/index.ts',import.meta.url),'utf8');
  assert.match(src,/const READ_BREAKER_MS=PROJECTION_BREAKER_MS;/);
  assert.match(src,/let projectionReadDegradedUntil=0;/);
  assert.match(src,/const STORE_DB_TIMEOUT_MS=2_500;/);
  assert.match(src,/const PROJECTION_BREAKER_MS=30_000;/);
  assert.match(src,/\.limit\(150\)/);
  assert.match(src,/\.limit\(600\)/);
  assert.match(src,/PROJECTION_STORE_UNAVAILABLE/);
  assert.match(src,/DATA_API_CIRCUIT_OPEN/);
  assert.match(src,/x-bg-service-token/);
});
