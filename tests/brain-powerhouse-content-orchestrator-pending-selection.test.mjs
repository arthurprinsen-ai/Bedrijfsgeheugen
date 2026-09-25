import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts', import.meta.url),'utf8');

test('orchestrator pending selection is array based and deterministic',()=>{
  assert.match(source,/\.eq\('state','decided'\)/);
  assert.match(source,/\.order\('priority',\{ascending:false\}\)/);
  assert.match(source,/\.order\('channel',\{ascending:true\}\)/);
  assert.match(source,/\.limit\(1\);/);
  assert.doesNotMatch(source,/select-pending[\s\S]{0,500}maybeSingle\(\)/);
  assert.match(source,/Array\.isArray\(pendingRows\)/);
});

test('orchestrator logs pending read diagnostics without leaking provider data',()=>{
  assert.match(source,/PENDING_READ_FAILED/);
  assert.match(source,/pendingError\.code/);
  assert.match(source,/pendingError\.message/);
});


test('orchestrator preserves sanitized AI provider status and model for autonomous recovery',()=>{
  assert.match(source,/class AIProviderHttpError extends Error/);
  assert.match(source,/AI_PROVIDER_REQUEST_FAILED:/);
  assert.match(source,/ORCHESTRATOR_AI_PROVIDER_ERROR/);
  assert.match(source,/AbortSignal\.timeout\(45000\)/);
});
