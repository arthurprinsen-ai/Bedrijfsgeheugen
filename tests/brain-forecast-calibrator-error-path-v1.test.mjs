import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-forecast-calibrator/index.ts','utf8');

test('forecast calibrator never calls catch on a Supabase query builder',()=>{
  assert.doesNotMatch(source,/db\.from\([^\n]+\)\.insert\([^\n]+\)\.catch\(/);
  assert.match(source,/catch\(e:any\)\{try\{await db\.from\('bg_gezondheid'\)\.insert/);
});

test('error-path health write remains best-effort and original 500 contract is preserved',()=>{
  assert.match(source,/status:'fout'/);
  assert.match(source,/contract:'predictive-first-mover-intelligence-v1'/);
  assert.match(source,/catch\{\}return json\(\{ok:false,error:/);
});
