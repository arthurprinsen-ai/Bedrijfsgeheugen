import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runWebsiteAnswer } from '../netlify/functions/_brain-ai.mjs';
const source=readFileSync(new URL('../netlify/functions/_brain-ai.mjs',import.meta.url),'utf8');
const route=readFileSync(new URL('../netlify/functions/vraag.mjs',import.meta.url),'utf8');
test('original GPT-5 Mini short answer has bounded low reasoning and enough visible completion budget',()=>{
  assert.match(source,/reasoning_effort:'low'/);
  assert.match(source,/max_completion_tokens:maxTokens/);
  assert.match(source,/maxTokens:2200, fetchImpl/);
  assert.doesNotMatch(source,/maxTokens:(500|600),/);
  assert.match(source,/gov|provider:'OpenAI'/);
  assert.doesNotMatch(source,/ANTHROPIC_API_KEY|api\.anthropic\.com/);
});
test('empty OpenAI length finish is NOT a successful public answer',async()=>{
  let payload;
  const fetchImpl=async(_url,opts)=>{
    payload=JSON.parse(opts.body);
    return {ok:true,status:200,json:async()=>({choices:[{finish_reason:'length',message:{content:null}}],usage:{prompt_tokens:40,completion_tokens:2200,total_tokens:2240,completion_tokens_details:{reasoning_tokens:2200}}})};
  };
  await assert.rejects(runWebsiteAnswer({question:'Welke diensten biedt Bedrijfsgeheugen?',fragments:'Het bedrijf biedt data- en AI-diensten.',apiKey:'test-only',system:'Alleen broninhoud',fetchImpl}),/OPENAI_OUTPUT_BUDGET_EXHAUSTED/);
  assert.equal(payload.model,'gpt-5-mini');
  assert.equal(payload.reasoning_effort,'low');
  assert.equal(payload.max_completion_tokens,2200);
});
test('short valid OpenAI answer remains a truthful website answer',async()=>{
  const fetchImpl=async()=>({ok:true,status:200,json:async()=>({choices:[{finish_reason:'stop',message:{content:'Bedrijfsgeheugen ondersteunt ondernemers met data en AI.'}}]})});
  const result=await runWebsiteAnswer({question:'Wat doet Bedrijfsgeheugen?',fragments:'Het bedrijf ondersteunt ondernemers met data en AI.',apiKey:'test-only',system:'Alleen broninhoud',fetchImpl});
  assert.match(result.text,/ondernemers met data en AI/);
});
test('website remains privacy-safe and does not claim a false success on empty provider output',()=>{
  assert.match(route,/OPENAI_OUTPUT_BUDGET_EXHAUSTED/);
  assert.match(route,/X-BG-Recovery-Class/);
  assert.match(route,/status:502/);
  assert.doesNotMatch(route,/console\.error\(error\)|console\.error\(vraag\)/);
});
