import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/bg-externe-signalen/index.ts',import.meta.url),'utf8');
test('retains scheduler-only authentication and bounded topics',()=>{
 assert.match(source,/powerhouse_daily_scheduler_token/);
 assert.match(source,/req\.headers\.get\('x-powerhouse-token'\)!==expected/);
 assert.match(source,/const BATCH=3/);
 assert.match(source,/AbortSignal\.timeout\(TAVILY_TIMEOUT_MS\)/);
});
test('uses two independent real providers when quota is exhausted',()=>{
 assert.match(source,/DATAFORSEO_ENDPOINT='https:\/\/api\.dataforseo\.com\/v3\/serp\/google\/organic\/live\/advanced'/);
 assert.match(source,/if\(!r\.ok\)throw new Error\(`HTTP_/);
 assert.match(source,/if\(!dataforseoReady\)throw error/);
 assert.match(source,/await dataforseoSerp\(o\.zoekvraag,dataforseoLogin,dataforseoPassword\)/);
});
test('only organic verified URLs, no paid results or fabricated relevance',()=>{
 assert.match(source,/x\.type==='organic'/);
 assert.match(source,/^.*rank_proxy_not_provider_relevance.*$/m);
 assert.match(source,/published_date:typeof x\.timestamp==='string'\?x\.timestamp:null/);
 assert.match(source,/allowed:rows\.filter\(x=>x\.toegestaan\)\.length/);
});
test('records exact provider lineage in canonical source observation',()=>{
 assert.match(source,/sourceKey=providers\.includes\('tavily'\)\?'tavily-intelligence':'dataforseo-intelligence'/);
 assert.match(source,/p_source_key:'external-intelligence'/);
 assert.match(source,/source_routes:ok\.map/);
 assert.match(source,/sourceKey\+':'\+observedAt/);
});
test('never treats both providers failing as a successful run',()=>{
 assert.match(source,/return json\(out,ok\.length\?\(failed\.length\?207:200\):502\)/);
 assert.match(source,/await bewijs\(verdict\.green,out,verdict\.errorClass\)/);
});
test('sanitizes upstream provider errors before public JSON or Brain evidence',()=>{
 assert.match(source,/const safeFailure=/);
 assert.match(source,/fallbackReason=safeFailure\(error\)/);
 assert.match(source,/error:safeFailure\(e\)/);
 assert.match(source,/contract:CONTRACT,error:safeFailure\(e\)/);
 assert.doesNotMatch(source,/String\(b\.status_message\|\|'error'\)/);
});

const policy = await import('../supabase/functions/bg-externe-signalen/provider-retry.mjs');
test('DataForSEO temporary server and documented processing errors are retryable once',()=>{
  assert.equal(policy.isTransientDataforseoStatus(503,0,0),true);
  assert.equal(policy.isTransientDataforseoStatus(200,50000,0),true);
  assert.equal(policy.isTransientDataforseoStatus(200,20000,40103),true);
  assert.equal(policy.isTransientDataforseoStatus(200,20000,50401),true);
});
test('auth, billing, quota, rate limit and invalid field are never silently retried',()=>{
  for(const status of [401,402,403,429])
    assert.equal(policy.isTransientDataforseoStatus(status,20000,0),false);
  for(const code of [40100,40104,40202,40203,40506])
    assert.equal(policy.isTransientDataforseoStatus(200,code,0),false);
});
test('single transient error recovers once, with bounded delay',async()=>{
  let calls=0;const delays=[];
  const result=await policy.withOneTransientDataforseoRetry(async()=>{
    calls++;if(calls===1)throw Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{retryable:true});
    return [{url:'https://www.rvo.nl'}];
  },{sleep:async ms=>delays.push(ms),delayMs:300});
  assert.equal(calls,2);
  assert.deepEqual(delays,[300]);
  assert.equal(result.length,1);
});
test('repeated provider failure stops after two calls; never creates retry queue',async()=>{
  let calls=0;
  await assert.rejects(policy.withOneTransientDataforseoRetry(async()=>{
    calls++;throw Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{retryable:true});
  },{sleep:async()=>{}}),/DATAFORSEO_REMOTE_FAILURE/);
  assert.equal(calls,2);
});
test('provider plan or billing failure is never retried even once',async()=>{
  let calls=0;await assert.rejects(policy.withOneTransientDataforseoRetry(async()=>{
    calls++;throw Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{retryable:false});
  },{sleep:async()=>{}}),/DATAFORSEO_REMOTE_FAILURE/);
  assert.equal(calls,1);
});
test('no SERP results is observed empty; cannot fabricate positive market signals',()=>{
  assert.equal(policy.isEmptyDataforseoResult(40102),true);
  assert.equal(policy.isEmptyDataforseoResult(40103),false);
  assert.match(source,/if\(task&&isEmptyDataforseoResult\(taskStatus\)\)return \[\]/);
});
test('one bounded retry is wired into unchanged secured collector',()=>{
  assert.match(source,/withOneTransientDataforseoRetry\(\(\)=>dataforseoSerpOnce/);
  assert.match(source,/isTransientDataforseoStatus\(r\.status,apiStatus,taskStatus\)/);
  assert.match(source,/req\.headers\.get\('x-powerhouse-token'\)!==expected/);
});

test('partial provider failure and recovered success within the same hour keep distinct run evidence',()=>{
 const upstream="p_dedupe_key:'external-source-run:'+sourceKey+':'+observedAt+':'+start";
 const canonical="p_dedupe_key:'external-intelligence-producer:'+observedAt+':'+start";
 assert.ok(source.includes(upstream),'upstream receipt must use full invocation event time');
 assert.ok(source.includes(canonical),'canonical receipt must not share hourly dedupe key');
 assert.ok(source.includes("p_external_event_id:'external-intelligence:'+observedAt"));
 const failedAt='2026-10-25T09:49:17.092Z';
 const recoveredAt='2026-10-25T09:50:47.474Z';
 const key=(time)=>'external-intelligence-producer:'+time+':'+42;
 assert.notEqual(key(failedAt),key(recoveredAt));
 assert.equal(key(recoveredAt),key(recoveredAt),'same source event remains idempotent');
 assert.ok(!source.includes("p_dedupe_key:'external-intelligence-producer:'+observedAt.slice(0,13)"));
 assert.ok(!source.includes("p_dedupe_key:'external-source-run:'+observedAt.slice(0,13)"));
});

test('no-topic producer observations use full event time rather than hour dedupe',()=>{
 assert.ok(source.includes("p_dedupe_key:'external-intelligence-empty:'+observedAt"));
 assert.ok(!source.includes("p_dedupe_key:'external-intelligence-empty:'+observedAt.slice(0,13)"));
});

test('documented temporary DataForSEO upstream and update 503xx can retry once',()=>{
  for(const status of [50301,50302,50303,50304]){
    assert.equal(policy.isTransientDataforseoStatus(200,20000,status),true);
    assert.equal(policy.isTransientDataforseoStatus(200,status,0),true);
  }
});

test('sanitized diagnostics retain numeric class, but never a raw provider response or credentials',()=>{
 const failure=Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{
  retryable:true,http_status:200,api_status:20000,task_status:50303,
  secret:'private-api-key',raw:'upstream account billing response'
 });
 assert.deepEqual(policy.safeDataforseoDiagnostic(failure),{
   http_status:200,api_status:20000,task_status:50303,retryable:true
 });
 assert.doesNotMatch(JSON.stringify(policy.safeDataforseoDiagnostic(failure)),/private-api-key|upstream account/);
 assert.equal(policy.safeDataforseoDiagnostic(new Error('unrelated')),null);
 assert.deepEqual(policy.safeDataforseoDiagnostic(Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{
   retryable:false,http_status:'invalid',api_status:-99,task_status:1000000
 })),{http_status:null,api_status:null,task_status:null,retryable:false});
});

test('per-topic failed provider codes reach canonical observation without weakening strict response status',()=>{
 assert.match(source,/provider_diagnostics:safeDataforseoDiagnostic\(e\)/);
 assert.match(source,/failed_source_diagnostics:failed\.map/);
 assert.match(source,/return json\(out,ok\.length\?\(failed\.length\?207:200\):502\)/);
 assert.match(source,/x-powerhouse-token/);
});

test('independent Brain source completion never claims GREEN for a partial provider batch',()=>{
  assert.deepEqual(policy.sourceBatchEvidenceVerdict([{ok:true},{ok:true},{ok:true}]),{green:true,errorClass:null});
  assert.deepEqual(policy.sourceBatchEvidenceVerdict([{ok:true},{ok:false},{ok:true}]),{green:false,errorClass:'REMOTE'});
  assert.deepEqual(policy.sourceBatchEvidenceVerdict([{ok:false},{ok:false},{ok:false}]),{green:false,errorClass:'REMOTE'});
  assert.deepEqual(policy.sourceBatchEvidenceVerdict([]),{green:false,errorClass:'REMOTE'});
  assert.throws(()=>policy.sourceBatchEvidenceVerdict(null),/SOURCE_BATCH_RESULTS_REQUIRED/);
});

test('HTTP 207 and provider receipts cannot be relabeled success by the delivery evidence writer',()=>{
 assert.match(source,/const verdict=sourceBatchEvidenceVerdict\(results\)/);
 assert.match(source,/await bewijs\(verdict\.green,out,verdict\.errorClass\)/);
 assert.doesNotMatch(source,/await bewijs\(ok\.length>0,out/);
 assert.match(source,/return json\(out,ok\.length\?\(failed\.length\?207:200\):502\)/);
});
