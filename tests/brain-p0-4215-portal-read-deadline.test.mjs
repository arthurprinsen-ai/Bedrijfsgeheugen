import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/portal-state-eu/bounded-reads.js',import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
const {boundedReads}=await import('data:text/javascript,'+encodeURIComponent(source));
test('10 lazy reads preserve order and never exceed canonical concurrency',async()=>{
 let active=0,peak=0;
 const jobs=Array.from({length:10},(_,n)=>async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,4));active--;return n;});
 const values=await boundedReads(jobs,{maxConcurrent:3,slowStageMs:100,stageTimeoutMs:2000,onSlow:()=>{}});
 assert.deepEqual(values,Array.from({length:10},(_,i)=>i));
 assert.ok(peak<=3);
});
test('stalled PostgREST-style job is aborted and no partial result escapes',async()=>{
 let aborted=false;
 const never=(signal)=>new Promise((resolve,reject)=>{
  signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'))},{once:true});
 });
 const started=Date.now();
 await assert.rejects(boundedReads([()=>['data'],never],{maxConcurrent:2,slowStageMs:100,stageTimeoutMs:175,onSlow:()=>{}}));
 assert.equal(aborted,true);
 assert.ok(Date.now()-started<1800);
});
test('a job that ignores abort cannot extend the hard Promise.race deadline',async()=>{
 let observedSignal;
 await assert.rejects(boundedReads([signal=>{observedSignal=signal;return new Promise(()=>{});} ],{maxConcurrent:1,slowStageMs:100,stageTimeoutMs:160,onSlow:()=>{}}),/PORTAL_READ_DEADLINE_EXCEEDED/);
 assert.equal(observedSignal.aborted,true);
});
test('invalid budgets are rejected fail-closed; HTTP requests use native signal',async()=>{
 await assert.rejects(boundedReads([async()=>1],{slowStageMs:150,stageTimeoutMs:100}),/READ_STAGE_TIMEOUT_INVALID/);
 assert.match(edge,/return async\(signal:AbortSignal\)=>/);
 assert.match(edge,/await query\.abortSignal\(signal\)/);
 for(const phrase of ['x-bg-service-token','entrepreneur_intelligence','tenantId','PORTAL_READ_FAILED']) assert.ok((source+edge).includes(phrase));
});
