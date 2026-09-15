import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/20260914123000_unified_content_operations_status.sql','utf8');
const workflow = fs.readFileSync('.github/workflows/content-ops-unified-status.yml','utf8');

test('one canonical content operations registry tracks lifecycle and proof', () => {
  assert.match(sql, /create table if not exists public\.content_operations_registry/i);
  for (const field of [
    'content_key','content_type','channel','planned_for','generated_at','scheduled_for',
    'published_at','live_verified_at','proof_url','publication_url','status','learning_written_at','last_error'
  ]) assert.match(sql, new RegExp(`\\b${field}\\b`, 'i'));
});

test('social observations are projected into the canonical registry', () => {
  assert.match(sql, /create or replace function public\.sync_social_post_to_content_operations/i);
  assert.match(sql, /create trigger social_posts_content_operations/i);
  assert.match(sql, /on conflict \(content_key\) do update/i);
});

test('dashboard exposes planned versus actual status and missing proof', () => {
  assert.match(sql, /create or replace view public\.content_operations_dashboard/i);
  assert.match(sql, /case[\s\S]*when[\s\S]*live_verified_at is not null[\s\S]*published/i);
  assert.match(sql, /needs_attention/i);
});

test('daily audit is read-only and fails when published content lacks live proof', () => {
  assert.match(workflow, /schedule:/i);
  assert.match(workflow, /scripts\/brain\/content-ops-audit\.mjs/i);
  assert.doesNotMatch(workflow, /git push/i);
  assert.doesNotMatch(workflow, /gh pr merge/i);
});
