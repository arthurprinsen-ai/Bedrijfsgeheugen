import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('connector guidance uses original governed OpenAI provider and server secret only',()=>{
  const s=source('netlify/functions/_connector-ai.mjs');
  assert.match(s,/const MODEL='gpt-5-mini'/);
  assert.match(s,/provider:'OpenAI'/);
  assert.match(s,/process\.env\.OPENAI_API_KEY/);
  assert.ok(s.includes("fetchImpl('https://api.openai.com/v1/chat/completions'"));
  assert.ok(!s.includes('ANTHROPIC_API_KEY'));
  assert.match(s,/assertAiAllowed\(tenantId\)/);
  assert.match(s,/NO_CREDENTIALS/);
  assert.match(s,/AI-CONNECTOR-GUIDE/);
  assert.match(s,/OPENAI_CONNECTOR_GUIDE_EMPTY/);
});
test('document extraction keeps original authenticated safe-test and moves inference to OpenAI only',()=>{
  const sourceText=source('platform/connectors/document-extractor-provider.mjs');
  const wrapper=source('netlify/functions/document-extractor.mjs');
  assert.ok(sourceText.includes("fetchFn('https://api.openai.com/v1/chat/completions'"));
  assert.ok(wrapper.includes("Netlify.env.get('OPENAI_API_KEY')"));
  assert.ok(!wrapper.includes('ANTHROPIC_API_KEY'));
  assert.match(sourceText,/openaiApiKey/);
  assert.match(sourceText,/x-bg-safe-test-token/);
  assert.match(sourceText,/PAYLOAD_TOO_LARGE/);
  assert.match(sourceText,/tool_choice:\{type:'function',function:\{name:'extract'\}\}/);
  assert.match(sourceText,/DOCUMENT_EXTRACTION_INVALID_PROVIDER_RESPONSE/);
  assert.match(sourceText,/normalizedExtraction\(parsed\)/);
});
