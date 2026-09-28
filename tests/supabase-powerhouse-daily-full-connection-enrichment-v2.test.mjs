import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928160019_powerhouse_daily_full_connection_enrichment_v2.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-external-intelligence/SKILL.md','utf8');

test('every canonical connection receives a daily enrichment pass',()=>{
  assert.match(migration,/powerhouse_refresh_all_connection_enrichment_v1/);
  assert.match(migration,/full_graph_daily_refresh/);
  assert.match(migration,/all_ingested_linkedin_and_external_evidence_projected/);
  assert.match(migration,/powerhouse_connection_enrichment_coverage_v1/);
  assert.match(skill,/minimaal één volledige enrichment-pass per kalenderdag/i);
});

test('daily enrichment reuses canonical evidence and preserves data quality boundaries',()=>{
  assert.match(migration,/linkedin_engagement_events/);
  assert.match(migration,/powerhouse_predictive_signals/);
  assert.match(migration,/bg_bedrijfsnieuws/);
  assert.match(migration,/powerhouse_runtime_events/);
  assert.match(migration,/detailed_evidence_preserved_in_canonical_stores/);
  assert.match(migration,/sensitive_inference_allowed',false/);
  assert.match(skill,/geen scraping\/platform-bypass/i);
});

test('social observations only fill missing canonical core fields',()=>{
  assert.match(migration,/naam=coalesce\(nullif\(trim\(c\.naam\),''\),nullif\(trim\(r\.latest_name\),''\)\)/);
  assert.match(migration,/bedrijf=coalesce\(nullif\(trim\(c\.bedrijf\),''\),nullif\(trim\(r\.latest_company\),''\)\)/);
  assert.match(migration,/rol=coalesce\(nullif\(trim\(c\.rol\),''\),nullif\(trim\(r\.latest_role\),''\)\)/);
});

test('existing commercial scheduler remains the only owner',()=>{
  assert.match(migration,/v_connection_enrichment:=public\.powerhouse_refresh_all_connection_enrichment_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
});
