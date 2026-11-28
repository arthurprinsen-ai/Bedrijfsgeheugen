import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn=fs.readFileSync('supabase/functions/bg-opdrachtenradar/index.ts','utf8');
const sql=fs.readFileSync('supabase/migration-history/repository-only/20260918130000_bg_opdrachtenradar_nightly_v1.sql','utf8');

test('Opdrachtenradar producer is authenticated and uses vault-backed keys only',()=>{
  assert.match(fn,/powerhouse_daily_scheduler_token/);
  assert.match(fn,/x-powerhouse-token/);
  assert.match(fn,/geheim\('TAVILY_API_KEY'\)/);
  assert.match(fn,/geheim\('OPENAI_API_KEY'\)/);
  assert.doesNotMatch(fn,/tvly-[A-Za-z0-9]/);
  assert.doesNotMatch(fn,/sk-ant-/);
  assert.doesNotMatch(fn,/decrypted_secrets/);
});

test('Opdrachtenradar tables are service-role only with RLS',()=>{
  for (const t of ['bg_opdrachten','bg_opdrachten_genegeerd','bg_opdrachten_profiel']) {
    assert.match(sql,new RegExp(`alter table public\\.${t} enable row level security`));
    assert.match(sql,new RegExp(`revoke all on table public\\.${t} from public, anon, authenticated`));
  }
});

test('Opdrachtenradar writes canonical evidence and health without fabricating opportunities',()=>{
  assert.match(fn,/powerhouse_record_source_observation_v1/);
  assert.match(fn,/opdrachtenradar-producer-run:/);
  assert.match(fn,/producer_run: true/);
  assert.match(fn,/PRODUCER_HEARTBEAT/);
  assert.match(fn,/bg_gezondheid/);
  assert.match(fn,/Verzin geen gegevens/);
  assert.match(sql,/'opdrachtenradar', 'external_intelligence'/);
});

test('Opdrachtenradar runs nightly through the existing scheduler authority',()=>{
  assert.match(sql,/bg-opdrachtenradar-nightly/);
  assert.match(sql,/30 1 \* \* \*/);
  assert.match(sql,/net\.http_post/);
  assert.match(sql,/functions\/v1\/bg-opdrachtenradar/);
  assert.match(sql,/powerhouse_daily_scheduler_token/);
});
test('Opdrachtenradar splits extra sources, filters noise, scores 0-100 and supports vault-gated job APIs',()=>{
  assert.match(fn,/DOMEINEN_PER_GROEP = 7/);
  assert.match(fn,/Eigen domeinen \$\{/);
  assert.match(fn,/isRuis\(r\.url\)/);
  assert.match(fn,/LinkedIn-posts/);
  assert.match(fn,/geheel getal van 0 tot 100/);
  assert.match(fn,/geheim\('ADZUNA_APP_ID'\)/);
  assert.match(fn,/geheim\('ADZUNA_APP_KEY'\)/);
  assert.match(fn,/geheim\('JOOBLE_API_KEY'\)/);
});

test('original Opdrachtenradar AI is exclusively OpenAI with forced typed source-result schema',()=>{
  assert.match(fn,/api\.openai\.com\/v1\/chat\/completions/);
  assert.match(fn,/model: MODEL, max_completion_tokens/);
  assert.match(fn,/tool_choice: \{ type: 'function', function: \{ name: 'beoordeel' \} \}/);
  assert.match(fn,/OPENAI_OUTPUT_ITEMS_INVALID/);
  assert.match(fn,/OPENAI_OUTPUT_SCHEMA_INVALID/);
  assert.match(fn,/OPENAI_REFUSAL/);
  assert.doesNotMatch(fn,/api\.anthropic\.com|ANTHROPIC_API_KEY|claude-haiku/);
  assert.match(fn,/seen\.has\(o\.i\)/);
  assert.match(fn,/uit\.length !== deel\.length/);
});
