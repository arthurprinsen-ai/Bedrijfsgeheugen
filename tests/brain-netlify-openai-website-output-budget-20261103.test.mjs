import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Dependency-free canonical learning replay: the early admission runner deliberately does not install Netlify blobs.
// Evaluate the actual original helper source in isolation; never mock its business logic or change production imports.
const source=readFileSync(new URL('../netlify/functions/_brain-ai.mjs',import.meta.url),'utf8');
const route=readFileSync(new URL('../netlify/functions/vraag.mjs',import.meta.url),'utf8');
const start=source.indexOf('async function openai({');
const end=source.indexOf('async function attachTokenUsage(',start);
assert.ok(start>=0&&end>start,'original OpenAI inference helper must exist');
const openai=new Function('fetch',source.slice(start,end)+'\nreturn openai;')(globalThis.fetch);
const argumentsFor=fetchImpl=>({
  authorized:{context:{question:'Wat doet Bedrijfsgeheugen?',fragments:'Bedrijfsgeheugen ondersteunt ondernemers met data en AI.'}},
  apiKey:'test-only',
  system:'Beantwoord alleen op basis van bronnen',
  maxTokens:2200,
  renderUser:ctx=>ctx.question+'\n'+ctx.fragments,
  provenance:{source:'website-index',providerModelId:'OPENAI-GPT-5-MINI'},
  fetchImpl
});
test('original website GPT-5 mini bounded low reasoning and enough visible output tokens',()=>{
  assert.match(source,/reasoning_effort:'low'/);
  assert.match(source,/max_completion_tokens:maxTokens/);
  assert.match(source,/maxTokens:2200, fetchImpl/);
  assert.doesNotMatch(source,/maxTokens:(500|600),/);
  assert.match(source,/provider:'OpenAI'/);
  assert.doesNotMatch(source,/ANTHROPIC_API_KEY|api\.anthropic\.com/);
});
test('empty completion with length finish is rejected as exhausted budget, never GREEN',async()=>{
  let payload;
  const fetchImpl=async(_url,opts)=>{
    payload=JSON.parse(opts.body);
    return {ok:true,status:200,json:async()=>({
      choices:[{finish_reason:'length',message:{content:null}}],
      usage:{prompt_tokens:40,completion_tokens:2200,total_tokens:2240,completion_tokens_details:{reasoning_tokens:2200}}
    })};
  };
  await assert.rejects(openai(argumentsFor(fetchImpl)),/OPENAI_OUTPUT_BUDGET_EXHAUSTED/);
  assert.equal(payload.model,'gpt-5-mini');
  assert.equal(payload.reasoning_effort,'low');
  assert.equal(payload.max_completion_tokens,2200);
});
test('original source helper gives supported non-empty answer to original Brain gateway',async()=>{
  const fetchImpl=async()=>({ok:true,status:200,json:async()=>({
    choices:[{finish_reason:'stop',message:{content:'Bedrijfsgeheugen ondersteunt ondernemers met data en AI.'}}]
  })});
  const result=await openai(argumentsFor(fetchImpl));
  assert.equal(result.type,'Observation');
  assert.match(result.text,/ondernemers met data en AI/);
});
test('website diagnosis remains privacy-safe, fail closed and provider-exclusive',()=>{
  assert.match(route,/OPENAI_OUTPUT_BUDGET_EXHAUSTED/);
  assert.match(route,/X-BG-Recovery-Class/);
  assert.match(route,/status:502/);
  assert.doesNotMatch(route,/console\.error\(error\)|console\.error\(vraag\)/);
});
