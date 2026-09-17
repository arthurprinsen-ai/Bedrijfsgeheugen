import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('publisher converts Buffer 429 into a controlled retryable boundary instead of an uncaught 500',()=>{
  const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  assert.match(publisher,/class\s+BufferHttpError/);
  assert.match(publisher,/headers\.get\(['"]retry-after['"]\)/);
  assert.match(publisher,/instanceof\s+BufferHttpError[\s\S]{0,160}status\s*===\s*429/);
  assert.match(publisher,/BUFFER_RATE_LIMITED/);
  assert.match(publisher,/retryable:\s*true/);
});
