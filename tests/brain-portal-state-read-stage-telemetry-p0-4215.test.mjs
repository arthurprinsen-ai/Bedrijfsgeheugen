import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boundedReads } from '../supabase/functions/portal-state-eu/bounded-reads.js';

test('all ten entrepreneur reads remain lazy, ordered and max-three concurrent',async()=>{
 let concurrent=0,max=0,scheduled=0;
 const jobs=Array.from({length:10},(_,i)=>async()=>{
  scheduled++;concurrent++;max=Math.max(max,concurrent);
  await new Promise(resolve=>setTimeout(resolve,2));
  concurrent--;return [i];
 });
 assert.equal(scheduled,0);
 const result=await boundedReads(jobs,{maxConcurrent:3,onSlow:()=>{}});
 assert.deepEqual(result.map(x=>x[0]),Array.from({length:10},(_,i)=>i));
 assert.equal(max,3);
 assert.equal(scheduled,10);
});

test('slow stage identifies the query group without logging tenant data',async()=>{
 const log=[];
 const jobs=Array.from({length:10},(_,i)=>()=>i===6
   ?new Promise(resolve=>setTimeout(()=>resolve([i]),160))
   :Promise.resolve([i]));
 const result=await boundedReads(jobs,{maxConcurrent:3,slowStageMs:100,onSlow:message=>log.push(message)});
 assert.equal(result.length,10);
 assert.ok(log.some(x=>/PORTAL_READ_SLOW trace=[a-f0-9]{8} stage=COMPANY_IMPACT elapsed_ms=/.test(x)));
 assert.ok(log.some(x=>x.includes('PORTAL_READ_RECOVERED')&&x.includes('stage=COMPANY_IMPACT')));
 assert.equal(log.some(x=>x.includes('tenant-id')||x.includes('secret-token')),false);
});

test('one failed read rejects the whole batch, never fakes empty intelligence',async()=>{
 const log=[];
 await assert.rejects(boundedReads([
  async()=>[{id:1}],
  async()=>{throw new Error('db failed')}
 ],{onSlow:message=>log.push(message)}),/db failed/);
 assert.equal(log.length,1);
 assert.match(log[0],/PORTAL_READ_FAILED/);
 assert.match(log[0],/stage=2/);
 assert.equal(log[0].includes('db failed'),false);
});

test('invalid options reject before starting any reads',async()=>{
 let launched=false;
 await assert.rejects(boundedReads([()=>{launched=true}],{slowStageMs:0}),/READ_SLOW_THRESHOLD_INVALID/);
 assert.equal(launched,false);
});
