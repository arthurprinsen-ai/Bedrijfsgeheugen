import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn=fs.readFileSync('supabase/functions/powerhouse-dataforseo-intelligence/index.ts','utf8');
const sql=fs.readFileSync('supabase/migrations/20260918100000_powerhouse_dataforseo_intelligence_schedule_v1.sql','utf8');

test('DataForSEO producer is authenticated and uses vault-backed credentials',()=>{
  assert.match(fn,/powerhouse_daily_scheduler_token/);
  assert.match(fn,/DATAFORSEO_LOGIN/);
  assert.match(fn,/DATAFORSEO_PASSWORD/);
  assert.match(fn,/x-powerhouse-token/);
  assert.doesNotMatch(fn,/DATAFORSEO_(LOGIN|PASSWORD)\s*=\s*['"]/);
});

test('DataForSEO observations enter canonical evidence and keyword intelligence',()=>{
  assert.match(fn,/bg_zoekwoordkansen/);
  assert.match(fn,/powerhouse_record_source_observation_v1/);
  assert.match(fn,/dataforseo-intelligence/);
  assert.match(fn,/bron:'dataforseo'/);
  assert.match(fn,/opportunity_score/);
});

test('successful zero-result DataForSEO runs still write truthful source evidence',()=>{
  assert.match(fn,/dataforseo-run:/);
  assert.match(fn,/dataforseo-provider-run/);
  assert.match(fn,/SUCCESS_ZERO_ITEMS/);
  assert.match(fn,/items:items\.length/);
  assert.match(fn,/RUN_EVIDENCE_STORE/);
});

test('DataForSEO runtime is scheduled daily through existing scheduler authority',()=>{
  assert.match(sql,/powerhouse-dataforseo-intelligence-daily/);
  assert.match(sql,/20 4 \* \* \*/);
  assert.match(sql,/net\.http_post/);
  assert.match(sql,/powerhouse-dataforseo-intelligence/);
  assert.match(sql,/powerhouse_daily_scheduler_token/);
});
