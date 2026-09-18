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

test('DataForSEO runtime is scheduled daily through existing scheduler authority',()=>{
  assert.match(sql,/powerhouse-dataforseo-intelligence-daily/);
  assert.match(sql,/20 4 \* \* \*/);
  assert.match(sql,/net\.http_post/);
  assert.match(sql,/powerhouse-dataforseo-intelligence/);
  assert.match(sql,/powerhouse_daily_scheduler_token/);
});

test('successful zero-item DataForSEO runs still prove producer health without fabricating keywords',()=>{
  assert.match(fn,/dataforseo-producer-run:/);
  assert.match(fn,/producer_run:true/);
  assert.match(fn,/no_data_returned:items\.length===0/);
  assert.match(fn,/PRODUCER_HEARTBEAT/);
  assert.doesNotMatch(fn,/zoekwoord:['"]producer-run/);
});
