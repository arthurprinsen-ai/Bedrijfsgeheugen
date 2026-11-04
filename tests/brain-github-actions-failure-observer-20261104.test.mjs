import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyActionsRun,observeNativeFailure,observeNativeFailureBatch,resolveBrainAuthority,scanNativeFailures}
 from '../tools/delivery/github-actions-failure-observer.mjs';
const repo='arthurprinsen-ai/Bedrijfsgeheugen';
const sha='0d47c8983be1e5add00cb48cb05a561632253a1a';
const run={id:41792546872,workflow_id:202,run_attempt:1,head_sha:sha,status:'completed',
 conclusion:'failure',name:'Required test',event:'pull_request',
 created_at:'2026-11-04T07:42:42Z',updated_at:'2026-11-04T07:45:42Z'};
const env={GITHUB_REPOSITORY:repo,SUPABASE_URL:'https://example.supabase.co',
 SUPABASE_SERVICE_ROLE_KEY:'fixture-not-real'};
test('actual failed native run maps to stable canonical fingerprint with exact run/attempt',()=>{
 const x=classifyActionsRun(run);
 assert.equal(x.state,'NATIVE_FAILURE');
 assert.equal(x.fingerprint,'github|actions|workflow-202|failure');
 assert.equal(x.occurrenceId,'github-actions:workflow:202:run:41792546872:attempt:1:failure');
 assert.equal(x.evidence.root_cause,'UNKNOWN_PENDING_ORIGINAL_FAILED_JOB_LOG');
 assert.equal(x.evidence.is_synthetic,false);
 assert.equal(x.evidence.head_sha,sha);
 assert.equal(classifyActionsRun({...run,run_attempt:2}).occurrenceId.includes('attempt:2'),true);
 assert.equal(classifyActionsRun(run).payloadSha256,x.payloadSha256);
});
test('success, neutral and intentional cancellation are not falsely counted as errors',()=>{
 for(const conclusion of ['success','neutral','cancelled','skipped'])
  assert.equal(classifyActionsRun({...run,conclusion}).state,'NO_NATIVE_FAILURE');
 for(const conclusion of ['failure','timed_out','action_required','startup_failure','stale'])
  assert.equal(classifyActionsRun({...run,conclusion}).state,'NATIVE_FAILURE');
 assert.equal(classifyActionsRun({...run,head_sha:'bad'}).state,'SOURCE_RUN_INVALID');
 assert.equal(classifyActionsRun({...run,conclusion:'cancelled',head_sha:null}).state,'NO_NATIVE_FAILURE');
});
test('native ONE BRAIN insert and independent exact row/hash readback are mandatory',async()=>{
 const x=classifyActionsRun(run);
 const authority=resolveBrainAuthority(env);
 let posted=null;let reads=0;
 const fetchImpl=async(url,req)=>{
  if(req.method==='POST'){posted=JSON.parse(req.body);return {ok:true,status:200};}
  reads++;
  return {ok:true,status:200,json:async()=>posted?[{
   occurrence_id:posted.p_occurrence_id,fingerprint:posted.p_fingerprint,
   payload_sha256:posted.p_payload_sha256}]:[]};
 };
 assert.equal(await observeNativeFailure(x,{authority,fetchImpl}),'RECORDED_AND_VERIFIED');
 assert.equal(posted.p_fingerprint,x.fingerprint);
 assert.equal(reads,2);
 assert.equal(await observeNativeFailure(x,{authority,fetchImpl}),'ALREADY_VERIFIED');
 assert.equal(reads,3);
});
test('hash/identity conflicts and missing provider readback fail closed',async()=>{
 const x=classifyActionsRun(run),authority=resolveBrainAuthority(env);
 await assert.rejects(()=>observeNativeFailure(x,{authority,
  fetchImpl:async()=>({ok:true,status:200,json:async()=>[{
   occurrence_id:x.occurrenceId,fingerprint:x.fingerprint,payload_sha256:'mismatch'}]})}),
  /BRAIN_OCCURRENCE_CONFLICT/);
 await assert.rejects(()=>observeNativeFailure(x,{authority,
  fetchImpl:async(_url,req)=>req.method==='POST'?{ok:true,status:200}:
    {ok:true,status:200,json:async()=>[]}}),
  /BRAIN_OCCURRENCE_READBACK_MISSING/);
});
test('hourly native scan performs exactly one idempotent occurrence, no synthetic success',async()=>{
 const paths=[],observed=[];
 const api=async path=>{paths.push(path);return {total_count:2,workflow_runs:[run,{...run,id:41792546873,
  conclusion:'success'}]};};
 const result=await scanNativeFailures({env,api,now:new Date('2026-11-04T09:00:00Z'),
  authority:{origin:'https://example.supabase.co',headers:{}},
  observe:async item=>{observed.push(item);return 'RECORDED_AND_VERIFIED';}});
 assert.equal(result.scanned,24);assert.equal(result.windows,12);assert.equal(result.failures,1);
 assert.equal(result.recorded,1);assert.equal(result.readback_complete,true);
 assert.equal(result.global_green,false);
 assert.equal(observed.length,1);
 assert.match(paths[0],/status=completed/);
});
test('missing source/credentials or truncated pagination never claims full coverage',async()=>{
 assert.throws(()=>resolveBrainAuthority({...env,SUPABASE_SERVICE_ROLE_KEY:''}),
  /BRAIN_AUTHORITY_CREDENTIAL_MISSING/);
 await assert.rejects(()=>scanNativeFailures({env,api:async()=>({invalid:true})}),
  /GITHUB_RUNS_SOURCE_UNAVAILABLE/);
 await assert.rejects(()=>scanNativeFailures({env,api:async()=>({
   total_count:2000,workflow_runs:Array.from({length:100},(_,i)=>({...run,id:41792546872+i,conclusion:'success'}))
 }),observe:async()=> 'ALREADY_VERIFIED'}),
  /GITHUB_RUNS_WINDOW_OVERFLOW/);
});
test('batch existing receipts needs two reads, one canonical write for only missing rows',async()=>{
 const first=classifyActionsRun(run),second=classifyActionsRun({...run,id:41792546874});
 const authority=resolveBrainAuthority(env);
 const stored=new Map([[first.occurrenceId,first]]);
 const calls=[];
 const fetchImpl=async(url,req)=>{
  calls.push({url,method:req.method||'GET'});
  if(req.method==='POST'){
   const posted=JSON.parse(req.body);
   assert.equal(posted.p_occurrence_id,second.occurrenceId);
   stored.set(posted.p_occurrence_id,second);
   return {ok:true,status:200};
  }
  return {ok:true,status:200,json:async()=>[...stored.values()].map(x=>({
   occurrence_id:x.occurrenceId,fingerprint:x.fingerprint,payload_sha256:x.payloadSha256}))};
 };
 const result=await observeNativeFailureBatch([first,second],{authority,fetchImpl});
 assert.deepEqual(result,{recorded:1,already_verified:1});
 assert.equal(calls.filter(x=>x.method==='POST').length,1);
 assert.equal(calls.filter(x=>x.method==='GET').length,2);
 assert.ok(calls[0].url.includes('occurrence_id=in.('));
});
test('batch refuses contradictory source hashes and never marks them green',async()=>{
 const item=classifyActionsRun(run),authority=resolveBrainAuthority(env);
 await assert.rejects(()=>observeNativeFailureBatch([item],{authority,
  fetchImpl:async()=>({ok:true,status:200,json:async()=>[{
   occurrence_id:item.occurrenceId,fingerprint:item.fingerprint,payload_sha256:'wrong'}]})}),
  /BRAIN_BATCH_READBACK_CONFLICT/);
});
test('same existing hourly Janitor hosts source observer without new cron, workflow or side effects',()=>{
 const w=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.match(w,/cron: '17 \* \* \* \*'/);
 assert.match(w,/name: Observe failed GitHub Actions in canonical ONE BRAIN/);
 assert.match(w,/github-actions-failure-observer\.mjs --observe/);
 assert.match(w,/github-actions-failure-observer\.json/);
 assert.match(w,/if: always\(\)/);
 assert.doesNotMatch(w,/workflow_run:/);
});
