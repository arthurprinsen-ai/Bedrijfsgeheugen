import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20261022161000_instagram_proof_status_truth_v1.sql', import.meta.url),
  'utf8'
);
const master = readFileSync(
  new URL('../supabase/functions/_shared/mira-canonical-face.mjs', import.meta.url),
  'utf8'
);

test('one existing proof trigger is amended without bypass, disable or duplicate scheduler', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.enforce_instagram_media_proof_vision_v1\(\)/);
  assert.match(migration, /SECURITY DEFINER\s+SET search_path TO 'public', 'pg_catalog'/);
  assert.match(migration, /powerhouse_instagram_visual_proof_valid_v1\(v_visual, v_media_type\) IS NOT TRUE/);
  assert.doesNotMatch(migration, /(?:DROP\s+TRIGGER|DISABLE\s+TRIGGER|ALTER\s+TABLE.*DISABLE)/i);
  assert.doesNotMatch(migration, /\b(?:INSERT|DELETE)\s+(?:INTO|FROM)\s+public\.content_publication_obligations/i);
});

test('extracted video_frame requires exact 1080x1920 rather than image 1080x1350', () => {
  assert.match(migration, /IN \('video', 'reel', 'video_frame'\)/);
  assert.match(migration, /'height'\)::int, 0\) = 1920/);
  assert.match(migration, /IN \('image', 'static_image'\)/);
  assert.match(migration, /'height'\)::int, 0\) = 1350/);
  assert.match(migration, /INSTAGRAM_PROOF_STATUS_VALID_VERTICAL_FRAME_REJECTED/);
  assert.match(migration, /INSTAGRAM_PROOF_STATUS_WRONG_REEL_ASPECT_ACCEPTED/);
});

test('canonical reference and 0.94 facial identity floor remain protected', () => {
  const match = master.match(/MIRA_MASTER_REFERENCE_ID='([^']+)'/);
  assert.ok(match, 'official Mira reference required');
  assert.ok(migration.includes(match[1]));
  assert.match(migration, /face_identity_match/);
  assert.match(migration, /face_identity_confidence'\)::numeric, 0\) >= 0\.94/);
  assert.match(migration, /INSTAGRAM_PROOF_STATUS_WEAK_FACE_ACCEPTED/);
  assert.match(migration, /INSTAGRAM_PROOF_STATUS_WRONG_MASTER_ACCEPTED/);
  assert.match(migration, /two_image_vision/);
});

test('contradictory provisional PASS is demoted without deleting actual publication receipts', () => {
  assert.match(migration, /NEW\.identity_gate_result IS DISTINCT FROM 'PASS'/);
  assert.match(migration, /NEW\.provider_status = 'prepublish_verified'/);
  assert.match(migration, /NEW\.provider_status := 'prepublish_rejected'/);
  assert.match(migration, /'exact_final_media_proven', false/);
  assert.match(migration, /'instagram_visual', v_visual \|\| jsonb_build_object\('verified', false\)/);
  assert.doesNotMatch(migration, /NEW\.provider_post_id\s*:=|NEW\.provider_external_url\s*:=/);
});
