import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedReads} from '../supabase/functions/portal-state-eu/bounded-reads.js';

test('EU portal reads preserve original result ordering while limiting concurrency',async()=>{
 let active=0,peak=0;
 const calls=[];
 const jobs=Array.from({length:10},(_,i)=>async()=>{
  active++;peak=Math.max(peak,active);calls.push(i);
  await new Promise(resolve=>setImmediate(resolve));
  active--;return 'result:'+i;
 });
 const results=await boundedReads(jobs,{maxConcurrent:3});
 assert.deepEqual(results,jobs.map((_,i)=>'result:'+i));
 assert.equal(peak,3);
 assert.deepEqual(calls,[0,1,2,3,4,5,6,7,8,9]);
});
test('a failed upstream batch aborts subsequent reads and never returns fabricated data',async()=>{
 const calls=[];
 const jobs=Array.from({length:8},(_,i)=>async()=>{
  calls.push(i);
  if(i===1)throw new Error('POSTGREST_504');
  return i;
 });
 await assert.rejects(()=>boundedReads(jobs,{maxConcurrent:3}),/POSTGREST_504/);
 assert.deepEqual(calls,[0,1,2]);
});
test('no uncapped fan-out or eager query invocation is allowed',async()=>{
 assert.deepEqual(await boundedReads([]),[]);
 await assert.rejects(()=>boundedReads([Promise.resolve(1)]),/READ_JOBS_INVALID/);
 await assert.rejects(()=>boundedReads([async()=>1],{maxConcurrent:0}),/READ_CONCURRENCY_INVALID/);
 await assert.rejects(()=>boundedReads([async()=>1],{maxConcurrent:11}),/READ_CONCURRENCY_INVALID/);
});

test('a timed-out PostgREST stage aborts and subsequent batches never start',async()=>{
 const seen=[];
 const jobs=[
  async(signal)=>new Promise((resolve,reject)=>{
   seen.push('A');
   signal.addEventListener('abort',()=>reject(new Error('ABORTED_AT_TRANSPORT')),{once:true});
  }),
  async()=>{seen.push('B');return 'ok'},
  async()=>{seen.push('C');return 'should not start'}
 ];
 await assert.rejects(()=>boundedReads(jobs,{maxConcurrent:2,perStageTimeoutMs:500,slowStageMs:150,onSlow:()=>{}}),/ABORTED_AT_TRANSPORT/);
 assert.deepEqual(seen,['A','B']);
});
test('stage budgets reject invalid values',async()=>{
 await assert.rejects(()=>boundedReads([],{perStageTimeoutMs:-1}),/READ_STAGE_TIMEOUT_INVALID/);
 await assert.rejects(()=>boundedReads([],{perStageTimeoutMs:400}),/READ_STAGE_TIMEOUT_INVALID/);
 await assert.rejects(()=>boundedReads([],{perStageTimeoutMs:30001}),/READ_STAGE_TIMEOUT_INVALID/);
});
