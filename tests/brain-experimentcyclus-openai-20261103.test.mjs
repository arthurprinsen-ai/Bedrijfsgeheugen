import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../supabase/functions/bg-experimentcyclus/index.ts',import.meta.url),'utf8');
test('original weekly experiment producer checks its own active OpenAI use case',()=>{
  assert.match(s,/const USE_CASE = 'supabase-bg-experimentcyclus-v1'/);
  assert.match(s,/gov\.provider !== 'OpenAI'/);
  assert.match(s,/p_naam: 'OPENAI_API_KEY'/);
  assert.match(s,/api\.openai\.com\/v1\/chat\/completions/);
  assert.ok(!s.includes('api.anthropic.com'));
  assert.ok(!s.includes('ANTHROPIC_API_KEY'));
});
test('original experiment guard and autonomy remain intact',()=>{
  assert.match(s,/MIN_BEZOEKERS = 150/);
  assert.match(s,/lopend\.length/);
  assert.match(s,/bezoekers < MIN_BEZOEKERS/);
  assert.match(s,/poort\('beoordelen'\)/);
  assert.match(s,/poort\('voorstellen', v\)/);
  assert.match(s,/bg_bewijs/);
});
test('OpenAI tool schema and source-page validation fail closed',()=>{
  assert.match(s,/tool_choice: \{ type: 'function', function: \{ name: 'voorstel' \} \}/);
  assert.match(s,/parallel_tool_calls: false/);
  assert.match(s,/OPENAI_TOOL_RESULT_MISSING/);
  assert.match(s,/OPENAI_OUTPUT_CONTRACT_FAILED/);
  assert.match(s,/VOORSTEL_ONBEKENDE_PAGINA/);
  assert.match(s,/schema\.required\.every/);
});
