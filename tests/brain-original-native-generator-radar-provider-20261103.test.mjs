import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../supabase/functions/'+p+'/index.ts',import.meta.url),'utf8');
const generator=read('bg-native-content-generate'),radar=read('bg-kansenradar');
test('legacy native content generator uses EXACT previously approved OpenAI provider/model from ONE BRAIN, never Anthropic',()=>{
  assert.match(generator,/const USE_CASE = 'supabase-bg-native-content-generate-v4'/);
  assert.match(generator,/gov\.provider !== 'OpenAI'/);
  assert.match(generator,/gov\.approved !== true/);
  assert.match(generator,/gov\.lifecycle_status !== 'ACTIVE'/);
  assert.match(generator,/const model = gov\.model_id/);
  assert.match(generator,/secret\('OPENAI_API_KEY', 'OPENAI_API_KEY'\)/);
  assert.match(generator, /^\s*const ai = await fetch\('https:\/\/api\.openai\.com\/v1\/chat\/completions', \{$/m);
  assert.doesNotMatch(generator,/api\.anthropic\.com|anthropicKey|ANTHROPIC_API_KEY/);
});
test('strict schema and source-grounded editorial gates run before any Notion draft write',()=>{
  assert.match(generator,/response_format: \{ type: 'json_schema', json_schema: \{ name: 'bg_content', strict: true, schema: SCHEMA \} \}/);
  assert.match(generator,/max_completion_tokens: 6500/);
  assert.match(generator,/if \(message\?\.refusal\)/);
  assert.match(generator,/JSON\.parse\(String\(message\?\.content \|\| ''\)\)/);
  assert.match(generator,/const issues = problems\(parsed, candidate\)/);
  assert.match(generator,/if \(!out\) return fail\(503/);
  assert.ok(generator.indexOf('const issues = problems(parsed, candidate)') < generator.indexOf("const properties: Record<string, any> ="));
  assert.match(generator,/Nog niet goedgekeurd voor publicatie/);
  assert.match(generator,/VERZONNEN/);
  assert.match(generator,/getallen\(veld === 'firstComment'/);
});
test('source does not invent approval, force provider spend or publish',()=>{
  assert.doesNotMatch(generator,/\.from\('brain_ai_governance_registry'\)\.update\(/);
  assert.doesNotMatch(generator,/social_publish|post_to_linkedin|send_email/);
  assert.match(generator,/const candidate =|let candidate: any = null/);
});
test('radar uses only the owner-approved OpenAI provider and no Anthropic billing fallback',()=>{
  assert.match(radar,/gov\.provider !== 'OpenAI'/);
  assert.match(radar,/const USE_CASE = 'supabase-bg-kansenradar-v1'/);
  assert.match(radar,/gov\.approved !== true/);
  const providerCall = radar.match(/\bfetch\('([^']+)'/);
  assert.ok(providerCall, 'native radar provider call must exist');
  const providerEndpoint = new URL(providerCall[1]);
  assert.equal(providerEndpoint.origin, 'https://api.openai.com');
  assert.equal(providerEndpoint.pathname, '/v1/chat/completions');
  assert.ok(!radar.includes('ANTHROPIC_API_KEY'));
  assert.match(radar,/await geheim\('OPENAI_API_KEY'\)/);
});
test('radar does not inherit stale Anthropic credit receipt guard after OpenAI switch',()=>{
  assert.ok(radar.includes('tool_choice:'));
  assert.ok(radar.includes('parallel_tool_calls: false'));
  assert.ok(radar.includes('OPENAI_TOOL_RESULT_MISSING'));
  assert.match(radar,/max_completion_tokens: 5500/);
  assert.match(radar,/OPENAI_OUTPUT_CONTRACT_FAILED/);
  assert.match(radar,/OPENAI_REFUSAL/);
  assert.ok(!radar.includes('creditWindowStart'));
  assert.ok(!radar.includes('AI_PROVIDER_CREDITS_EXHAUSTED'));
});
test('OpenAI radar remains draft-only, original owner and failure evidence retained',()=>{
  assert.match(radar,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
  assert.match(radar,/db\.rpc\('bg_bewijs'/);
  assert.match(radar,/status: 'suggested'/);
  assert.match(radar,/const fail = async/);
  assert.match(radar,/gov\.approved !== true/);
  assert.match(radar,/gov\.lifecycle_status !== 'ACTIVE'/);
});

test('both original Edge owners enforce ONE BRAIN incident instrumentation marker',()=>{
  for(const source of [generator,radar]){
    assert.match(source,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
    assert.match(source,/db\.rpc\('bg_bewijs'/);
  }
});
