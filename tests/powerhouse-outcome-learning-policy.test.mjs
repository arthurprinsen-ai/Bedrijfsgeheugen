import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeUrl=new URL('../supabase/functions/powerhouse-runtime/index.ts',import.meta.url);

test('executed and skipped close actions but do not become positive learning',async()=>{
  const code=await readFile(runtimeUrl,'utf8');
  assert.match(code,/NON_LEARNING_OUTCOMES/);
  assert.match(code,/executed/);
  assert.match(code,/skipped/);
  assert.match(code,/return\{outcome:o,learning:null\}/);
});
