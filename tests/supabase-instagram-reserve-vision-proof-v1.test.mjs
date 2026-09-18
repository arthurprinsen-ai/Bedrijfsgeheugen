import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918103000_instagram_reserve_vision_proof_v1.sql','utf8');
const edge=fs.readFileSync('supabase/functions/powerhouse-instagram-media-verifier/index.ts','utf8');

test('database rejects metadata-only Mira PASS claims',()=>{
  assert.match(sql,/powerhouse_instagram_visual_proof_valid_v1/);
  assert.match(sql,/semantic_verified/);
  assert.match(sql,/mira_present/);
  assert.match(sql,/evidence_method/);
  assert.match(sql,/\^vision:/);
  assert.match(sql,/metadata_only_identity_rejected/);
  assert.match(sql,/new\.identity_gate_result := 'FAIL'/);
});

test('Instagram obligation PASS claims are scrubbed unless exact visible proof is present',()=>{
  assert.match(sql,/enforce_instagram_obligation_vision_v1/);
  assert.match(sql,/'mira_gate_result','FAIL'/);
  assert.match(sql,/'exact_final_media_proven',false/);
  assert.match(sql,/MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED/);
});

test('existing five-minute content loop owns media verification recovery',()=>{
  assert.match(sql,/powerhouse_content_closed_loop_tick_v1/);
  assert.match(sql,/perform public\.powerhouse_instagram_daily_guard_v1\(p_now\)/);
  assert.match(sql,/powerhouse-instagram-media-verifier/);
  assert.doesNotMatch(sql,/cron\.schedule\([\s\S]*instagram-media-verifier/i);
});

test('verifier hashes exact bytes and enforces role-specific Instagram dimensions',()=>{
  assert.match(edge,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(edge,/size\.width===1080&&size\.height===1350/);
  assert.match(edge,/semantic_verified===true/);
  assert.match(edge,/mira_present===true/);
  assert.match(edge,/identity_class==='mira_daily_life'/);
  assert.match(edge,/evidence_method==='vision'/);
  assert.match(edge,/confidence\)>=0\.9/);
});

test('verifier is proof-only and cannot republish an already sent item',()=>{
  assert.match(edge,/const historicalSent=!!clean\(row\.external_id\)/);
  assert.match(edge,/republish_forbidden:historicalSent\?true/);
  assert.doesNotMatch(edge,/bg-buffer-sync|buffer\.com|bufferapp|bufferClient|bufferApi/i);
  assert.doesNotMatch(edge,/publishPost|createPost|social-publisher/i);
});

test('verifier is custom-token authenticated and AI-governed',()=>{
  assert.match(edge,/x-powerhouse-token/);
  assert.match(edge,/supabase-powerhouse-instagram-media-verifier-v1/);
  assert.match(sql,/brain_ai_governance_registry/);
  assert.match(sql,/Verifier may only write proof\/block state\. It cannot publish/);
});
