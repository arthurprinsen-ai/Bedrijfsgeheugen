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


test('deadline aborts the underlying request and halts subsequent batches',async()=>{
 const visited=[],signals=[];
 const jobs=[
  signal=>new Promise(resolve=>{signals.push(signal);signal.addEventListener('abort',()=>resolve('aborted'),{once:true})}),
  async signal=>{signals.push(signal);return 'ok'},
  async()=>{visited.push('third');return 'must-not-execute'}
 ];
 await assert.rejects(()=>boundedReads(jobs,{maxConcurrent:2,slowStageMs:20,readTimeoutMs:45,onSlow:()=>{}}),/PORTAL_READ_TIMEOUT/);
 assert.ok(signals[0].aborted);
 assert.deepEqual(visited,[]);
});
test('failure aborts other in-flight readers and never schedules following batches',async()=>{
 const signals=[],visited=[];
 const jobs=[
  signal=>new Promise(resolve=>{signals.push(signal);signal.addEventListener('abort',()=>resolve('cancelled'),{once:true})}),
  async()=>{throw new Error('DB_BUSY')},
  async()=>{visited.push('next-batch');return 3}
 ];
 await assert.rejects(()=>boundedReads(jobs,{maxConcurrent:2,slowStageMs:20,readTimeoutMs:100,onSlow:()=>{}}),/DB_BUSY/);
 assert.equal(signals[0].aborted,true);
 assert.deepEqual(visited,[]);
});
test('invalid deadline is rejected instead of launching uncontrolled reads',async()=>{
 await assert.rejects(()=>boundedReads([async()=>1],{slowStageMs:2000,readTimeoutMs:1000}),/READ_DEADLINE_INVALID/);
});
