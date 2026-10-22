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

test('migration must include complete SQL function bodies and transaction boundaries', () => {
  assert.match(migration, /AS \$validator\$[\s\S]*?\$validator\$;/);
  assert.match(migration, /AS \$function\$[\s\S]*?\$function\$;/);
  assert.equal((migration.match(/\bCREATE OR REPLACE FUNCTION\b/g) ?? []).length, 2);
  assert.match(migration, /BEGIN;[\s\S]*COMMIT;\s*$/);
  assert.match(migration, /AND EXISTS \(/);
  assert.match(migration, /WHEN lower\(coalesce\(p_media_type/);
  assert.match(migration, /'master_reference_sha256', ''\) =/);
  assert.match(migration, /INSTAGRAM_PROOF_STATUS_WRONG_MASTER_HASH_ACCEPTED/);
  assert.doesNotMatch(migration, /\\nRETURNS trigger\\nLANGUAGE plpgsql/);
});

test('autonomous recovery learning has semantic evidence and all required independent evaluation modes', async () => {
  const { fileURLToPath } = await import('node:url');
  const { compileLearningEvaluationPlan, validateEvaluationContract } = await import('../scripts/brain/learning-canonicalization-gate.mjs');
  const { evaluateLearningSemantics } = await import('../scripts/brain/material-writeback-closure-guard.mjs');
  const rootDir = fileURLToPath(new URL('../', import.meta.url));
  const learningFile = 'brain/learning/2026-10-22-mira-proof-status-vertical-frame-v1.json';
  const learning = JSON.parse(readFileSync(new URL('../' + learningFile, import.meta.url), 'utf8'));
  const plan = compileLearningEvaluationPlan(learning);
  assert.equal(plan.failure_class, 'DATA_INTEGRITY');
  assert.equal(plan.security_sensitive, true);
  assert.equal(plan.enforcement_kind, 'CI_SECURITY_GATE');
  assert.equal(plan.shadow_required, true);
  assert.equal(plan.canary_required, true);
  const contract = validateEvaluationContract(learning, plan, { rootDir });
  assert.deepEqual(contract.required_modes, ['historical_replay', 'shadow', 'canary']);
  assert.equal(contract.tests_by_mode.shadow.includes('tests/brain-mira-media-proof-status-truth-v1.test.mjs'), true);
  const semantic = evaluateLearningSemantics({ learningFiles: [learningFile], rootDir });
  assert.equal(semantic.ok, true, JSON.stringify(semantic.missing));
  assert.ok(learning.evidence?.production_readback, 'observed production evidence must be retained');
  assert.ok(learning.prevention.some(rule => rule.includes('autonomous agents')), 'pre-CI autonomous recovery prevention required');
});
