// Dependency-free source replay for the earliest ONE BRAIN canonical admission stage.
// Behavioral fetch/tenant/token tests run in the existing npm-installed CI lane.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const brain=source('netlify/functions/_brain-ai.mjs');
test('all three original user-facing wrappers select only the OpenAI secret',()=>{
  for(const p of ['netlify/functions/vraag.mjs','netlify/functions/portaalvraag.mjs','netlify/functions/i18n-translate.mjs']){
    const text=source(p);
    assert.ok(text.includes('process.env.OPENAI_API_KEY'),p);
    assert.ok(!text.includes('process.env.ANTHROPIC_API_KEY'),p);
  }
});
test('original shared Brain source registers OpenAI and no Anthropic API fallback',()=>{
  assert.match(brain,/provider:'OpenAI'/);
  assert.match(brain,/const MODEL = 'gpt-5-mini'/);
  assert.match(brain,/const TRANSLATION_MODEL = 'gpt-5-mini'/);
  assert.ok(brain.includes("fetchImpl('https://api.openai.com/v1/chat/completions'"));
  assert.ok(!brain.includes('ANTHROPIC_API_KEY'));
  assert.match(brain,/authorization:'Bearer '\+apiKey/);
  assert.match(brain,/max_completion_tokens:maxTokens/);
  assert.match(brain,/OPENAI_EMPTY_RESPONSE/);
  assert.match(brain,/OPENAI_REFUSAL/);
});
test('original tenant and source provenance guards remain invoked before model',()=>{
  assert.match(brain,/await assertTenantAiAllowed\(tenantId,sovereigntyClient\)/);
  assert.match(brain,/runGovernedProductionAI\(/);
  assert.match(brain,/allowedFields:\['question','fragments'\]/);
  assert.match(brain,/allowedFields:\['question','projectContext'\]/);
  assert.match(brain,/allowedFields:\['strings','source','target'\]/);
});
test('source retains real provider model and token use and fail-closed translation shape',()=>{
  assert.match(brain,/normalizeProviderTokenUsage\(\{ provider:'OpenAI'/);
  assert.match(brain,/safeResult\?\.provenance\?\.providerModelId/);
  assert.match(brain,/translations\.length !== strings\.length/);
  assert.match(brain,/Translation response shape mismatch/);
});
