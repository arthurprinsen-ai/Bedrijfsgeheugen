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
test('radar preserves exact existing Anthropic approval and rejects unsafe cross-provider fallback',()=>{
  assert.match(radar,/gov\.provider !== 'Anthropic'/);
  assert.match(radar,/const USE_CASE = 'supabase-bg-kansenradar-v1'/);
  assert.match(radar,/gov\.approved !== true/);
  assert.ok(!radar.includes('api.openai.com'));
});
test('radar refuses to repeat known insufficient-credit calls, preserves natural daily retry',()=>{
  assert.match(radar,/\.from\('brain_delivery_evidence'\)/);
  assert.match(radar,/\.eq\('component_id', BRON\)\.eq\('status', 'RED'\)/);
  assert.match(radar,/creditWindowStart/);
  assert.match(radar,/AI_PROVIDER_CREDITS_EXHAUSTED/);
  assert.match(radar,/WAITING_AUTHORIZED_BILLING_OR_ORIGINAL_PROVIDER_RECOVERY/);
  assert.match(radar,/existing_source_receipt_at/);
  assert.match(radar,/AI_40\[13\]\|AI_PROVIDER_CREDITS_EXHAUSTED\|NOTION_POST_40\[134\]/);
  assert.ok(!radar.includes('cron.schedule'));
  assert.ok(!radar.includes('OPENAI_API_KEY'));
});
test('radar never considers billing denial as green, and does not mark a source used',()=>{
  const failure=radar.indexOf("if (/credit balance is too low|insufficient.?credits|billing.?exhausted/i.test(recordedError))");
  const firstMutation=radar.indexOf("const nieuwItem = async");
  assert.ok(failure > 0 && firstMutation > failure);
  assert.match(radar,/return json\(\{ ok: false, error: 'AI_PROVIDER_CREDITS_EXHAUSTED'/);
  assert.match(radar,/if \(creditReadError\) return json\(\{ ok: false/);
});

test('both original Edge owners enforce ONE BRAIN incident instrumentation marker',()=>{
  for(const source of [generator,radar]){
    assert.match(source,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
    assert.match(source,/db\.rpc\('bg_bewijs'/);
  }
});
