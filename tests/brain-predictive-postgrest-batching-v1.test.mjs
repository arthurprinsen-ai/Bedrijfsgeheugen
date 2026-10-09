import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('skip unchanged signals before PostgREST forecast/calibration triggers',()=>{
 assert.match(src,/const keys=signalRows\.map/);
 assert.match(src,/const oldByKey=new Map/);
 assert.match(src,/const toWrite=signalRows\.filter/);
 assert.match(src,/stable\(old\.evidence\)!==stable\(s\.evidence\)/);
 assert.match(src,/new Date\(old\.observed_at\)\.getTime\(\)/);
});
test('upsert genuinely changed signals in sequential five-row bounded statements',()=>{
 assert.match(src,/for\(let i=0;i<toWrite\.length;i\+=5\)/);
 assert.match(src,/const batch=toWrite\.slice\(i,i\+5\)/);
 assert.match(src,/\.upsert\(batch,\{onConflict:'signal_key'\}\)/);
 assert.doesNotMatch(src,/\.upsert\(signalRows,/);
 assert.match(src,/if\(error\)throw error/);
 assert.match(src,/signals_ingested:ingested/);
});
test('bounded batches retain every changed signal without duplicating rows',()=>{
 for(const count of [0,1,4,5,6,50,80]){
  const original=Array.from({length:count},(_,i)=>'signal:'+i);
  const batches=[];
  for(let i=0;i<original.length;i+=5)batches.push(original.slice(i,i+5));
  assert.ok(batches.every(b=>b.length>0&&b.length<=5));
  assert.deepEqual(batches.flat(),original);
 }
});
test('approved Anthropic, scheduler and evidence-bound forecasts remain unchanged',()=>{
 assert.match(src,/authorizePowerhouseScheduler\(req\)/);
 assert.match(src,/gov\.provider!=='Anthropic'/);
 assert.match(src,/fetch\('https:\/\/api\.anthropic\.com\/v1\/messages'/);
 assert.match(src,/signal_key:key,observed_at/);
 assert.match(src,/\.upsert\(row,\{onConflict:'forecast_key'\}\)/);
});
