import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-forecast-calibrator/index.ts','utf8');

test('forecast calibrator error logging does not call catch on DirectQuery',()=>{
  assert.match(source,/catch\(e:any\)\{await db\.from\('bg_gezondheid'\)\.insert\(/);
  assert.doesNotMatch(source,/db\.from\('bg_gezondheid'\)\.insert\([\s\S]*?\)\.catch\(/);
});

test('DirectQuery remains promise-like only through then',()=>{
  assert.match(source,/then\(resolve:any,reject:any\)\{return this\.execute\(\)\.then\(resolve,reject\);\}/);
  assert.doesNotMatch(source,/catch\(reject:any\)\{/);
});
