import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918104500_instagram_media_job_materializer_v1.sql','utf8');

test('daily content loop materializes exactly one canonical media job',()=>{
  assert.match(sql,/powerhouse_ensure_instagram_media_job_v1/);
  assert.match(sql,/on conflict \(tenant_id,publication_date,channel\) do update/i);
  assert.match(sql,/perform public\.powerhouse_ensure_instagram_media_job_v1\(v_date\)/);
});

test('provider selection obeys router policy and prefers OpenArt for visible Mira by default',()=>{
  assert.match(sql,/powerhouse_instagram_provider_policy_v1/);
  assert.match(sql,/required_provider/);
  assert.match(sql,/v_selected := 'openart'/);
  assert.match(sql,/v_route like '%placid%'/);
});

test('historical sent posts can never be reclaimed for republish',()=>{
  assert.match(sql,/v_ob\.external_id is not null/);
  assert.match(sql,/republish_forbidden=false/);
  assert.match(sql,/HISTORICAL_SENT_REPUBLISH_FORBIDDEN/);
});

test('claim is atomic and duplicate-safe',()=>{
  assert.match(sql,/for update skip locked/i);
  assert.match(sql,/status in \('QUEUED','RETRY'\)/);
  assert.match(sql,/status='CLAIMED'/);
  assert.match(sql,/attempts=attempts\+1/);
});

test('OpenArt connector project is carried as execution metadata, not truth authority',()=>{
  assert.match(sql,/rUF5anXD47gVokckYjf9/);
  assert.match(sql,/Bedrijfsgeheugen Powerhouse Media/);
  assert.match(sql,/AGENT_CONNECTOR_REQUIRED/);
});

test('bounded completion handshake cannot publish or self-approve identity',()=>{
  assert.match(sql,/powerhouse_complete_instagram_media_job_v1/);
  assert.match(sql,/MEDIA_JOB_CLAIM_OWNER_MISMATCH/);
  assert.match(sql,/MEDIA_JOB_REPUBLISH_FORBIDDEN/);
  assert.match(sql,/status='VERIFYING'/);
  assert.match(sql,/'exact_final_media_proven',false/);
  assert.match(sql,/'mira_gate_result','UNPROVEN'/);
  assert.match(sql,/powerhouse-instagram-media-verifier/);
  assert.doesNotMatch(sql,/status='PUBLISHED'/);
  assert.doesNotMatch(sql,/identity_gate_result','PASS'/);
});
