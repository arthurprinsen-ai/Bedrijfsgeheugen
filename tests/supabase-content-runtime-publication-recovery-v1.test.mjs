import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher = fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const migration = fs.readFileSync('supabase/migrations/20260918081000_secure_bg_roep_functie_powerhouse_token_v1.sql','utf8');

test('social publisher does not require an undeclared PostgREST relationship', () => {
  assert.doesNotMatch(publisher, /powerhouse_content_artifacts\(body,generation_evidence,status\)/);
  assert.match(publisher, /artifactByChannel/);
  assert.match(publisher, /CONTENT_READY_ARTIFACT_READ/);
});

test('generic Edge Function invoker forwards Powerhouse scheduler auth fail-closed', () => {
  assert.match(migration, /powerhouse_daily_scheduler_token/);
  assert.match(migration, /'x-powerhouse-token'/);
  assert.match(migration, /revoke execute on function public\.bg_roep_functie\(text,jsonb\) from public, anon, authenticated/i);
});
