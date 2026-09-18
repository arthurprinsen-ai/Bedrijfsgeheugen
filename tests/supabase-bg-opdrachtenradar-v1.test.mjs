import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn=fs.readFileSync('supabase/functions/bg-opdrachtenradar/index.ts','utf8');
const sql=fs.readFileSync('supabase/migrations/20260918130000_bg_opdrachtenradar_nightly_v1.sql','utf8');

test('Opdrachtenradar producer is authenticated and uses vault-backed keys only',()=>{
  assert.match(fn,/powerhouse_daily_scheduler_token/);
  assert.match(fn,/x-powerhouse-token/);
  assert.match(fn,/geheim\('TAVILY_API_KEY'\)/);
  assert.match(fn,/geheim\('ANTHROPIC_API_KEY'\)/);
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
