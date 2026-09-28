import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928175500_powerhouse_daily_full_connection_enrichment_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-daily-full-connection-enrichment/SKILL.md','utf8');

test('all connections receive a daily enrichment pass',()=>{
  assert.match(migration,/powerhouse_refresh_all_connection_enrichment_v1/);
  assert.match(migration,/powerhouse_connection_enrichment_state_v1/);
  assert.match(migration,/powerhouse_connection_enrichment_v1/);
  assert.match(migration,/connections_enriched_today/);
  assert.match(skill,/Iedere connectie.*iedere kalenderdag/i);
});

test('full graph enrichment reuses existing scheduler',()=>{
  assert.match(migration,/powerhouse-commercial-learning-v1/i);
  assert.match(migration,/v_daily_connection_enrichment:=public\.powerhouse_refresh_all_connection_enrichment_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
});

test('enrichment remains evidence-first and privacy bounded',()=>{
  assert.match(migration,/sensitive_inference_allowed',false/);
  assert.match(migration,/public_or_authorized_sources_only',true/);
  assert.match(skill,/Geen gevoelige persoonsinferenties/);
  assert.match(skill,/geen scraping\/platform-bypass/i);
});
