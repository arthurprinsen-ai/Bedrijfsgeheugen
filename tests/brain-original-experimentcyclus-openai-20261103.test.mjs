import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../supabase/functions/bg-experimentcyclus/index.ts',import.meta.url),'utf8');
test('original weekly experiment engine uses only canonical approved OpenAI model',()=>{
 assert.match(src,/const USE_CASE = 'supabase-bg-experimentcyclus-v1'/);
 assert.match(src,/gov\.provider !== 'OpenAI'/);
 assert.match(src,/'OPENAI_API_KEY'/);
 assert.match(src,/https:\/\/api\.openai\.com\/v1\/chat\/completions/);
 assert.match(src,/authorization: `Bearer \$\{ak\}`/);
 assert.doesNotMatch(src,/ANTHROPIC_API_KEY|api\.anthropic\.com|claude-sonnet|tool_use/);
});
test('model must fill original typed experiment contract with forced function arguments',()=>{
 assert.match(src,/tool_choice: \{ type: 'function', function: \{ name: 'voorstel' \} \}/);
 assert.match(src,/parallel_tool_calls: false/);
 assert.match(src,/max_completion_tokens: 5500/);
 assert.match(src,/OPENAI_TOOL_RESULT_MISSING/);
 assert.match(src,/OPENAI_INVALID_JSON/);
 assert.match(src,/OPENAI_PROPOSAL_CONTRACT_FAILED/);
 assert.match(src,/schema\.required\.some/);
 assert.match(src,/!paginas\.some/);
 assert.match(src,/Number\.isInteger\(v\.min_steekproef\)/);
});
test('original 30-day traffic, one-at-time, source and human-approval guards stay intact',()=>{
 assert.match(src,/const MIN_BEZOEKERS = 150/);
 assert.match(src,/p\.pad === v\.pagina/);
 assert.match(src,/lopend\.length/);
 assert.match(src,/bezoekers < MIN_BEZOEKERS/);
 assert.match(src,/bg_experimentcyclus_poort/);
 assert.match(src,/poort\('voorstellen', v\)/);
 assert.match(src,/db\.rpc\('bg_bewijs'/);
 assert.match(src,/reden: 'er loopt of wacht al een experiment/);
 assert.ok(!src.includes('linkedin.com/v2'));
});
