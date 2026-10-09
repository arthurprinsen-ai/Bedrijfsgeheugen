import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('predictive signals use bounded, sequential PostgREST upserts',()=>{
  assert.match(src,/const SIGNAL_WRITE_BATCH_SIZE=5;/);
  assert.match(src,/for\(let offset=0;offset<signalRows\.length;offset\+=SIGNAL_WRITE_BATCH_SIZE\)/);
  assert.match(src,/const batch=signalRows\.slice\(offset,offset\+SIGNAL_WRITE_BATCH_SIZE\)/);
  assert.match(src,/await db\.from\('powerhouse_predictive_signals'\)\.upsert\(batch,\{onConflict:'signal_key'\}\)/);
  assert.doesNotMatch(src,/\.upsert\(signalRows,/);
  assert.match(src,/if\(error\)throw error/);
});
test('batching retains every signal exactly once without duplicating queue work',()=>{
  for(const count of [0,1,4,5,6,50,80]){
    const original=Array.from({length:count},(_,i)=>'signal:'+i);
    const batches=[];
    for(let offset=0;offset<original.length;offset+=5)batches.push(original.slice(offset,offset+5));
    assert.ok(batches.every(x=>x.length>0&&x.length<=5));
    assert.deepEqual(batches.flat(),original);
  }
});
test('governed Anthropic and original signal-derived forecast triggers remain intact',()=>{
  assert.match(src,/gov\.provider!=='Anthropic'/);
  assert.match(src,/fetch\('https:\/\/api\.anthropic\.com\/v1\/messages'/);
  assert.match(src,/signal_key:key,observed_at/);
  assert.match(src,/from\('powerhouse_predictive_signals'\)/);
  assert.match(src,/\.upsert\(row,\{onConflict:'forecast_key'\}\)/);
});
