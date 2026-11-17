import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 classifyActionsRun,recoverEarlierNativeAttempts,scanNativeFailures
} from '../tools/delivery/github-actions-failure-observer.mjs';

const env={GITHUB_REPOSITORY:'arthurprinsen-ai/Bedrijfsgeheugen'};
const authority={origin:'https://fixture.supabase.co',headers:{}};
const sha='0fbfa55f9b94ae5993d8307b761c16ce140cbf83';
const common={
 id:44061313845,workflow_id:347590495,
 head_sha:sha,status:'completed',
 name:'Required test PR #5940 '+sha,event:'pull_request',
 created_at:'2026-11-17T10:03:53Z'
};
const earlier={...common,run_attempt:1,conclusion:'failure',
 updated_at:'2026-11-17T10:04:35Z'};
const latest={...common,run_attempt:2,conclusion:'success',
 updated_at:'2026-11-17T10:11:00Z'};
const now=new Date('2026-11-17T10:14:00Z');

test('real native run confirms previous failure even after a successful rerun',async()=>{
 const calls=[],rows=[];
 let windows=0;
 const out=await scanNativeFailures({env,now,authority,
  api:async path=>{
   calls.push(path);
   if(path.endsWith('/attempts/1'))return earlier;
   windows++;
   return windows===1?{total_count:1,workflow_runs:[latest]}:
     {total_count:0,workflow_runs:[]};
  },
  observe:async item=>{
   rows.push(item);
   return 'RECORDED_AND_VERIFIED';
  }
 });
 assert.equal(windows,12);
 assert.equal(calls.filter(x=>x.includes('/attempts/')).length,1);
 assert.equal(rows.length,1);
 assert.equal(rows[0].occurrenceId,
  'github-actions:workflow:347590495:run:44061313845:attempt:1:failure');
 assert.equal(rows[0].payloadSha256,classifyActionsRun(earlier).payloadSha256);
 assert.equal(out.previous_attempts_inspected,1);
 assert.equal(out.previous_attempt_failures,1);
 assert.equal(out.failures,1);
 assert.equal(out.completed_windows,12);
 assert.equal(out.readback_complete,true);
 assert.equal(out.global_green,false);
});

test('all earlier unsuccessful attempts preserve distinct immutable IDs',async()=>{
 const a2={...common,run_attempt:2,conclusion:'timed_out',
  updated_at:'2026-11-17T10:06:00Z'};
 const a3={...common,run_attempt:3,conclusion:'success',
  updated_at:'2026-11-17T10:12:00Z'};
 const response=await recoverEarlierNativeAttempts(a3,{api:async path=>
  path.endsWith('/attempts/1')?earlier:a2
 });
 assert.equal(response.inspected,2);
 assert.equal(response.failures.length,2);
 assert.equal(new Set(response.failures.map(x=>x.occurrenceId)).size,2);
 assert.ok(response.failures.some(x=>x.fingerprint.endsWith('|failure')));
 assert.ok(response.failures.some(x=>x.fingerprint.endsWith('|timed_out')));
});

test('history is fail-closed when GitHub previous attempt has changed SHA/number/status',async()=>{
 for(const wrong of [
  {...earlier,id:earlier.id+1},
  {...earlier,run_attempt:2},
  {...earlier,workflow_id:1},
  {...earlier,head_sha:'b'.repeat(40)},
  {...earlier,status:'in_progress'}
 ]){
  await assert.rejects(
   ()=>recoverEarlierNativeAttempts(latest,{api:async()=>wrong}),
   /GITHUB_PREVIOUS_ATTEMPT_PROVIDER_IDENTITY_INVALID/
  );
 }
});

test('provider failure on earlier-attempt endpoint retains only prior durably checked windows',async()=>{
 let window=0,receipts=0;
 await assert.rejects(()=>scanNativeFailures({env,now,authority,
  api:async path=>{
   if(path.includes('/attempts/'))throw Error('PROVIDER_HISTORY_UNAVAILABLE');
   window++;
   return window===1?{total_count:1,workflow_runs:[earlier]}:
    window===2?{total_count:1,workflow_runs:[latest]}:
     {total_count:0,workflow_runs:[]};
  },
  observe:async()=>{receipts++;return 'RECORDED_AND_VERIFIED';}
 }),error=>{
  assert.match(error.message,/PROVIDER_HISTORY_UNAVAILABLE/);
  assert.equal(error.partial_checkpoint.completed_windows,1);
  assert.equal(error.partial_checkpoint.recorded,1);
  assert.equal(error.partial_checkpoint.readback_complete,false);
  assert.equal(error.partial_checkpoint.global_green,false);
  return true;
 });
 assert.equal(receipts,1);
});

test('excessive reruns cannot escape bounded original provider scan',async()=>{
 await assert.rejects(
  ()=>recoverEarlierNativeAttempts({...latest,run_attempt:52},{api:async()=>earlier}),
  /GITHUB_RUN_ATTEMPT_COUNT_UNVERIFIED/
 );
 await assert.rejects(
  ()=>recoverEarlierNativeAttempts({...latest,run_attempt:3},{api:async()=>earlier,budget:1}),
  /GITHUB_RUN_ATTEMPT_HISTORY_BUDGET_EXCEEDED/
 );
});

test('same original hourly Janitor, original Brain RPC and native exact attempt identities',()=>{
 const script=readFileSync('tools/delivery/github-actions-failure-observer.mjs','utf8');
 const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.match(script,/recoverEarlierNativeAttempts\(run,\{api,/);
 assert.match(script,/GITHUB_RUN_ATTEMPT_HISTORY_BUDGET_EXCEEDED/);
 assert.match(script,/observeNativeFailureBatch/);
 assert.match(script,/brain_observe_failure/);
 assert.match(workflow,/cron: '17 \* \* \* \*'/);
 assert.match(workflow,/github-actions-failure-observer\.mjs --observe/);
 assert.doesNotMatch(workflow,/workflow_run:/);
});
