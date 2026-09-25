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

test('orchestrator records only sanitized Anthropic validation detail',()=>{
  assert.match(source,/providerType=clean\(body\?\.error\?\.type/);
  assert.match(source,/providerMessage=clean\(body\?\.error\?\.message/);
  assert.match(source,/providerDetail=\[providerType,providerMessage\]/);
  assert.match(source,/slice\(0,240\)/);
  assert.doesNotMatch(source,/x-api-key.*console\.error/);
});

test('orchestrator falls back through governed Composio only for provider availability failures',()=>{
  assert.match(source,/COMPOSIO_SEARCH_GROQ_CHAT/);
  assert.match(source,/supabase-bg-composio-content-fallback-v1/);
  assert.match(source,/fallbackGov\.provider!=='Composio\/Groq'/);
  assert.match(source,/credit balance is too low/);
  assert.match(source,/\[401,403,429\]\.includes\(error\.status\)/);
  assert.match(source,/validArtifactObject/);
  assert.match(source,/Every factual statement and metadata value must be supported by the supplied user data/);
  assert.match(source,/generation_evidence:\{model:generationModel,provider:generationProvider,primary_model:gov\.model_id,fallback_reason:fallbackReason/);
});
