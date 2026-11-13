import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const earlier=readFileSync(new URL('../supabase/migrations/20261112214500_original_seo_derived_brain_manifest_handoff_v1.sql',import.meta.url),'utf8');
const repair=readFileSync(new URL('../supabase/migrations/20261112230000_original_seo_daily_archive_cardinality_guard_v1.sql',import.meta.url),'utf8');

test('original daily archive accepts the ninth derived SEO projection and guards presence',()=>{
  assert.match(earlier,/SELECT 'seo_opportunity_intelligence'/);
  assert.match(repair,/v_old constant text := 'IF v_manifest IS NULL OR v_saved<>8 THEN'/);
  assert.match(repair,/v_saved<9/);
  assert.match(repair,/NOT EXISTS\s*\(/);
  assert.match(repair,/source_key='seo_opportunity_intelligence'/);
  assert.match(repair,/metric_date=p_day/);
  assert.match(repair,/ORIGINAL_SEO_ARCHIVE_CARDINALITY_SOURCE_DRIFT/);
  assert.match(repair,/ORIGINAL_SEO_ARCHIVE_CARDINALITY_READBACK_FAILED/);
  assert.match(repair,/pg_get_functiondef\('public.powerhouse_daily_source_archive_v1\(date\)'::regprocedure\)/);
});

test('repair changes original guard only and cannot create another writer, scheduler or unsafe grant',()=>{
  const executable=repair.replace(/^--.*$/gm,'');
  assert.match(executable,/v_after:=replace\(v_before,v_old,v_new\)/);
  assert.match(executable,/position\(v_old IN substring\(v_before/);
  assert.doesNotMatch(executable,/\bcron\.schedule\s*\(|\bGRANT\b|\bALTER\s+TABLE\b|\bCREATE\s+TABLE\b|\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+TABLE\b/i);
});

test('SEO agent and skill require executable archive-replay and exact current consumer ACK',()=>{
  const agent=readFileSync(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8');
  const skill=readFileSync(new URL('../.agents/skills/powerhouse-seo-conversion-orders/SKILL.md',import.meta.url),'utf8');
  assert.match(agent,/verify-original-seo-archive-nine-source-guard-and-140-ack/);
  assert.match(skill,/GROWTH_SOURCE_MANIFEST_INCOMPLETE:9/);
  assert.match(skill,/powerhouse_daily_source_archive_v1/);
  assert.match(skill,/original.*#140.*Heartbeat/i);
});
