import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260925080500_instagram_media_reserve_replay_baseline_v1.sql','utf8');

test('Instagram media reserve replay baseline matches production security and core schema',()=>{
  assert.match(sql,/create table if not exists public\.powerhouse_instagram_media_reserve_v1/);
  assert.match(sql,/reserve_id text primary key/);
  assert.match(sql,/exact_media_sha256 text not null[\s\S]*\^\[0-9a-f\]\{64\}\$/);
  assert.match(sql,/identity_gate_result text not null default 'PASS'/);
  assert.match(sql,/enable row level security/);
  assert.match(sql,/revoke all[\s\S]*from public, anon, authenticated/);
  assert.match(sql,/grant select, insert, update, delete, truncate, references, trigger[\s\S]*to service_role/);
});
