import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260917154000_production_schema_replay_parity_v1.sql', import.meta.url);

test('fresh replay captures production-only operational schema without weakening access controls', () => {
  assert.ok(fs.existsSync(migrationPath), 'canonical replay parity migration must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  for (const table of [
    'bg_buffer_ingest_status',
    'bg_buffer_sync',
    'bg_ga4_sync',
    'bg_integrations',
    'bg_notion_sync',
    'bg_notion_webhooks',
    'bg_tasks',
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), `${table} must be replayable`);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `${table} must keep RLS enabled`);
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, 'i'), `${table} must remain inaccessible to client roles`);
    assert.match(sql, new RegExp(`grant all on table public\\.${table} to service_role`, 'i'), `${table} service role access must match production`);
  }

  assert.match(sql, /create or replace function public\.bg_actualiseer_connecties_via_lessen\(\)/i);
  assert.match(sql, /create or replace function public\.bg_brein_regels_check\(/i);
  assert.match(sql, /create or replace function intern\.bg_meetcijfers\(/i);
  assert.match(sql, /create or replace function private\.offerte_akkoord\(/i);
  assert.match(sql, /create or replace function public\.offerte_akkoord\(/i);

  assert.match(
    sql,
    /drop function if exists public\.bg_uitkomst_vastleggen\(text,text,numeric,text,text,text,jsonb\)/i,
    'obsolete seven-argument overload must not survive fresh replay',
  );
});
