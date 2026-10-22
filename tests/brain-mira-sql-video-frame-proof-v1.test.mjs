import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20261022154500_mira_video_frame_sql_proof_alignment_v1.sql',
  'utf8',
);
const visualVerifier = readFileSync(
  'supabase/functions/powerhouse-instagram-media-verifier/index.ts',
  'utf8',
);
const temporalVerifier = readFileSync(
  'supabase/functions/powerhouse-instagram-temporal-verifier/index.ts',
  'utf8',
);
const canonical = readFileSync('supabase/functions/_shared/mira-canonical-face.mjs', 'utf8');

test('Mira SQL video_frame is the existing 1080x1920 portrait video format, never a 1080x1350 image', () => {
  assert.match(migration, /IN \('video', 'reel', 'video_frame'\)/);
  assert.match(migration, /'height'\)::int, 0\) = 1920/);
  assert.match(migration, /'height'\)::int, 0\) = 1350/);
  assert.match(visualVerifier, /verificationRole==='video_frame'\?1920:1350/);
  assert.match(temporalVerifier, /\['start','middle','end'\]/);
});
test('SQL trigger cannot accept a video frame below the protected 94% Mira face minimum', () => {
  assert.match(migration, /'face_identity_match'\)::boolean, false\)/);
  assert.match(migration, /'face_identity_confidence'\)::numeric, 0\) >= 0\.94/);
  assert.match(canonical, /MIRA_IDENTITY_MIN_CONFIDENCE=0\.94/);
  assert.match(migration, /'canonical_reference_id' = 'Yjqu4D7v76HABNPmQPj1'/);
  assert.match(migration, /'identity_comparison_method' = 'two_image_vision'/);
  assert.match(migration, /'master_reference_sha256'[\s\S]*\^\[0-9a-f\]\{64\}/);
});
test('migration runs live SQL positive/negative assertions without changing past media proof rows', () => {
  assert.match(migration, /MIRA_SQL_VIDEO_FRAME_VALID_POSITIVE_REJECTED/);
  assert.match(migration, /MIRA_SQL_VIDEO_FRAME_UNDER_094_ACCEPTED/);
  assert.match(migration, /MIRA_SQL_VIDEO_FRAME_WRONG_FACE_ACCEPTED/);
  assert.match(migration, /MIRA_SQL_VIDEO_FRAME_WRONG_HEIGHT_ACCEPTED/);
  assert.match(migration, /MIRA_SQL_VIDEO_FRAME_NO_VISION_REF_ACCEPTED/);
  assert.match(migration, /MIRA_SQL_VIDEO_FRAME_WRONG_MASTER_ACCEPTED/);
  assert.match(migration, /MIRA_SQL_REEL_PREEXISTING_DIMENSIONS_BROKEN/);
  assert.match(migration, /MIRA_SQL_IMAGE_PREEXISTING_DIMENSIONS_BROKEN/);
  assert.doesNotMatch(migration, /\bUPDATE\s+public\.powerhouse_media_proof_evidence_v1\b/i);
  assert.doesNotMatch(migration, /\bDISABLE\s+TRIGGER\b/i);
  assert.match(migration, /^BEGIN;/m);
  assert.match(migration, /^COMMIT;/m);
});
