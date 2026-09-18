import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918095000_powerhouse_unified_data_intelligence_spine_v1.sql','utf8');

test('one canonical source-observation intake is idempotent and service-only',()=>{
  assert.match(sql,/powerhouse_record_source_observation_v1/);
  assert.match(sql,/on conflict \(dedupe_key\) do nothing/i);
  assert.match(sql,/SOURCE_NOT_REGISTERED/);
  assert.match(sql,/revoke execute[\s\S]*anon,authenticated/i);
  assert.doesNotMatch(sql,/create table\s+public\.powerhouse_.*raw/i);
});

test('analytics search social external and portal authorities feed the same brain evidence spine',()=>{
  for(const authority of [
    'bg_ga4_csv_batches','bg_zoekprestaties','social_metric_snapshots',
    'linkedin_engagement_events','bg_externe_signalen','portal_state_layers','portaal_stand'
  ]) assert.match(sql,new RegExp(authority));
  for(const source of [
    'ga4-analytics','gsc-search','linkedin','instagram-social',
    'external-intelligence','dataforseo-intelligence','portal-state'
  ]) assert.match(sql,new RegExp("'"+source+"'"));
});

test('social platform truth is separated from Buffer transport',()=>{
  assert.match(sql,/when v_platform='linkedin' then 'linkedin'/);
  assert.match(sql,/when v_platform='instagram' then 'instagram-social'/);
  assert.match(sql,/else 'social-buffer'/);
  assert.match(sql,/transport_source/);
});

test('reconcile repairs missed triggers from canonical source tables',()=>{
  assert.match(sql,/powerhouse_data_spine_reconcile_v1/);
  assert.match(sql,/for r in[\s\S]*bg_ga4_csv_batches/);
  assert.match(sql,/for r in select \* from public\.bg_zoekprestaties/);
  assert.match(sql,/social_metric_snapshots/);
  assert.match(sql,/linkedin_engagement_events/);
  assert.match(sql,/bg_externe_signalen/);
  assert.match(sql,/portal_state_layers/);
  assert.match(sql,/portaal_stand/);
});

test('watchdog is scheduled and does not turn missing producers green',()=>{
  assert.match(sql,/powerhouse_data_spine_watchdog_v1/);
  assert.match(sql,/powerhouse-data-spine-watchdog-v1/);
  assert.match(sql,/\*\/10 \* \* \* \*/);
  assert.match(sql,/PRODUCER_OR_INGEST_GAP/);
  assert.match(sql,/RECOVERY_DUE/);
  assert.match(sql,/when v_gaps=0 then 'GREEN' else 'AMBER'/);
});

test('DataForSEO is registered but cannot be fabricated as observed',()=>{
  assert.match(sql,/dataforseo-intelligence/);
  assert.match(sql,/Remains NOT_OBSERVED until a production producer writes verified evidence/);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_evidence_source_observations[\s\S]*dataforseo-intelligence[\s\S]*jsonb_build_object\('fake'/i);
});

test('portal evidence keeps tenant payload and source timestamps',()=>{
  assert.match(sql,/portal-layer:/);
  assert.match(sql,/source_updated_at/);
  assert.match(sql,/portaal-stand:/);
  assert.match(sql,/'state',new\.stand/);
});
