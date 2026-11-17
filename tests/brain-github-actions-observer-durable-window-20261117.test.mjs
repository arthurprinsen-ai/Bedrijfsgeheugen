import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scanNativeFailures} from '../tools/delivery/github-actions-failure-observer.mjs';

const env={GITHUB_REPOSITORY:'arthurprinsen-ai/Bedrijfsgeheugen'};
const authority={origin:'https://fixture.supabase.co',headers:{}};
const base={id:44053428979,workflow_id:347590495,run_attempt:1,
 head_sha:'22a60d7e17916d46afa2430d981aabd9843fda74',
 status:'completed',conclusion:'failure',
 name:'Required test PR #5940',event:'pull_request',
 created_at:'2026-11-17T09:12:25Z',updated_at:'2026-11-17T09:13:26Z'};
const now=new Date('2026-11-17T09:40:00Z');

test('original Janitor durable-writes completed earlier windows even if later GitHub source fails',async()=>{
 let calls=0;const recorded=[];
 let observedError=null;
 try{
  await scanNativeFailures({env,now,authority,
   api:async()=>{calls++;return calls===12?{not_a_native_source:true}:
     {total_count:1,workflow_runs:[base]};},
   observe:async item=>{recorded.push(item.occurrenceId);return 'RECORDED_AND_VERIFIED';}
  });
 }catch(error){observedError=error;}
 assert.ok(observedError);
 assert.match(observedError.message,/GITHUB_RUNS_SOURCE_UNAVAILABLE/);
 assert.equal(calls,12);
 assert.equal(recorded.length,1,'one stable original native occurrence survives after later source failure');
 assert.equal(observedError.partial_checkpoint.completed_windows,11);
 assert.equal(observedError.partial_checkpoint.recorded,1);
 assert.equal(observedError.partial_checkpoint.verified_failures,1);
 assert.equal(observedError.partial_checkpoint.readback_complete,false);
 assert.equal(observedError.partial_checkpoint.global_green,false);
});

test('first incomplete GitHub bucket never fabricates any durable incident coverage',async()=>{
 let calls=0,written=0;
 await assert.rejects(async()=>scanNativeFailures({env,now,authority,
  api:async()=>{calls++;return {total_count:2,workflow_runs:[base]};},
  observe:async()=>{written++;return 'RECORDED_AND_VERIFIED';}
 }),error=>{
  assert.match(error.message,/GITHUB_RUNS_PAGINATION_INCOMPLETE/);
  assert.equal(error.partial_checkpoint.completed_windows,0);
  assert.equal(error.partial_checkpoint.verified_failures,0);
  return true;
 });
 assert.equal(calls,1);
 assert.equal(written,0);
});

test('new failures in different verified windows are each written to original Brain once',async()=>{
 let calls=0;
 const ids=[];
 const other={...base,id:44053429000};
 const output=await scanNativeFailures({env,now,authority,
  api:async()=>{calls++;return {total_count:1,workflow_runs:[calls===1?base:calls===2?other:base]};},
  observe:async item=>{ids.push(item.occurrenceId);return 'RECORDED_AND_VERIFIED';}
 });
 assert.equal(calls,12);
 assert.equal(ids.length,2);
 assert.equal(new Set(ids).size,2);
 assert.equal(output.failures,2);
 assert.equal(output.recorded,2);
 assert.equal(output.completed_windows,12);
 assert.equal(output.readback_complete,true);
 assert.equal(output.global_green,false);
});

test('same GitHub native run/attempt with contradictory evidence fails closed after earlier receipt',async()=>{
 let calls=0,recorded=0;
 const conflicting={...base,updated_at:'2026-11-17T09:14:00Z'};
 await assert.rejects(async()=>scanNativeFailures({env,now,authority,
  api:async()=>{calls++;return {total_count:1,workflow_runs:[calls===1?base:conflicting]};},
  observe:async()=>{recorded++;return 'RECORDED_AND_VERIFIED';}
 }),error=>{
  assert.match(error.message,/GITHUB_RUN_CROSS_WINDOW_SOURCE_CONFLICT/);
  assert.equal(error.partial_checkpoint.completed_windows,1);
  assert.equal(error.partial_checkpoint.recorded,1);
  assert.equal(error.partial_checkpoint.readback_complete,false);
  return true;
 });
 assert.equal(recorded,1,'never silently overwrite first immutable provider receipt');
});

test('original hourly Janitor remains sole native failure observer, with no extra cron or producer',()=>{
 const source=readFileSync('tools/delivery/github-actions-failure-observer.mjs','utf8');
 const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.match(source,/for\(let slot=11;slot>=0;slot--\)/);
 assert.match(source,/await observeWindow\(fresh\)/);
 assert.match(source,/result\.completed_windows\+\+/);
 assert.match(source,/partial_checkpoint:error\?\.partial_checkpoint\|\|null/);
 assert.match(workflow,/cron: '17 \* \* \* \*'/);
 assert.match(workflow,/github-actions-failure-observer\.mjs --observe/);
 assert.doesNotMatch(workflow,/workflow_run:/);
});
