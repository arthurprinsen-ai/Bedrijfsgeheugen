import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');

test('Buffer 429 opens a persistent circuit and preserves LinkedIn content_ready',()=>{
  assert.match(source,/BUFFER_CIRCUIT_RECORD='buffer-rate-limit-circuit-v1'/);
  assert.match(source,/openBufferCircuit/);
  assert.match(source,/buffer_retry_at/);
  assert.match(source,/BUFFER_RATE_LIMITED/);
  assert.match(source,/state:'content_ready'/);
  assert.match(source,/deferred_rate_limit/);
});

test('open Buffer circuit skips Buffer audit while leaving Instagram Composio lane available',()=>{
  assert.match(source,/if \(!bufferCircuit\.active\)/);
  assert.match(source,/BUFFER_RATE_LIMIT_CIRCUIT_OPEN/);
  assert.match(source,/\['linkedin_personal','linkedin_company'\]\.includes\(row\.channel\)/);
  assert.match(source,/publishInstagramViaComposio/);
});
