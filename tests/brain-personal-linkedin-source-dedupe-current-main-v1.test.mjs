import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260925081000_linkedin_personal_source_dedupe_current_main_v1.sql','utf8');

test('canonical fallback function excludes prior personal LinkedIn content ids',()=>{
  assert.match(migration,/create or replace function public\.powerhouse_prepare_daily_content_fallbacks_v1\(p_date date\)/i);
  assert.match(migration,/prior\.target_channel='linkedin_personal'/);
  assert.match(migration,/prior\.run_date < p_date/);
  assert.match(migration,/prior\.evidence->>'content_id'/);
  assert.match(migration,/fallback-source:/);
});

test('canonical fallback function preserves fail-closed execution privileges',()=>{
  assert.match(migration,/security definer/i);
  assert.match(migration,/set search_path to 'public', 'pg_catalog'/i);
  assert.match(migration,/revoke execute on function public\.powerhouse_prepare_daily_content_fallbacks_v1\(date\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration,/grant execute on function public\.powerhouse_prepare_daily_content_fallbacks_v1\(date\)[\s\S]*to service_role/i);
});
