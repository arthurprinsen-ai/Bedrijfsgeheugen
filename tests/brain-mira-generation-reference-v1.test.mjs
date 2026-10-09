import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIRA_MASTER_REFERENCE_ID,
  MIRA_MASTER_REFERENCE_URL,
  MIRA_ALLOWED_REFERENCE_VIDEO_MODES,
  MIRA_IDENTITY_MIN_CONFIDENCE,
  validMiraGenerationReference,
  miraFaceProofValid
} from '../supabase/functions/_shared/mira-canonical-face.mjs';

const authorized = {
  openart_reference_id: MIRA_MASTER_REFERENCE_ID,
  openart_reference_url: MIRA_MASTER_REFERENCE_URL,
  openart_history_id: 'provider-confirmed-generation-id'
};
const identity = {
  canonical_reference_id: MIRA_MASTER_REFERENCE_ID,
  canonical_reference_url: MIRA_MASTER_REFERENCE_URL,
  master_reference_sha256: 'a'.repeat(64),
  face_identity_match: true,
  face_identity_confidence: MIRA_IDENTITY_MIN_CONFIDENCE,
  identity_comparison_method: 'two_image_vision'
};

test('master-anchored image2video and element2video remain valid modes', () => {
  assert.deepEqual([...MIRA_ALLOWED_REFERENCE_VIDEO_MODES], ['image2video', 'element2video']);
  for (const generation_mode of MIRA_ALLOWED_REFERENCE_VIDEO_MODES) {
    assert.equal(validMiraGenerationReference({ ...authorized, generation_mode }), true);
  }
});

test('unreferenced, mismatched, or unconfirmed generations cannot enter the media router', () => {
  const candidate = { ...authorized, generation_mode: 'element2video' };
  assert.equal(validMiraGenerationReference({ ...candidate, openart_reference_id: 'other-master' }), false);
  assert.equal(validMiraGenerationReference({ ...candidate, openart_reference_url: 'https://example.org/other.jpeg' }), false);
  assert.equal(validMiraGenerationReference({ ...candidate, openart_history_id: '' }), false);
  assert.equal(validMiraGenerationReference({ ...candidate, generation_mode: 'text2video' }), false);
  assert.equal(validMiraGenerationReference({ ...candidate, generation_mode: 'image2image' }), false);
});

test('face verification retains strict confidence and all three video frames', () => {
  const makeFrame = position => ({ ...identity, position });
  const frames = ['start', 'middle', 'end'].map(makeFrame);
  assert.equal(miraFaceProofValid({ ...identity, frame_evidence: frames }, 'reel'), true);
  assert.equal(miraFaceProofValid({ ...identity, frame_evidence: frames.slice(0, 2) }, 'reel'), false);
  assert.equal(miraFaceProofValid({ ...identity, frame_evidence: frames.map(x=> x.position==='middle'?{...x,face_identity_match:false}:x) }, 'reel'), false);
  assert.equal(miraFaceProofValid({ ...identity, face_identity_confidence: MIRA_IDENTITY_MIN_CONFIDENCE - 0.01, frame_evidence: frames }, 'reel'), false);
  assert.equal(miraFaceProofValid({ ...identity, master_reference_sha256: 'not-a-sha', frame_evidence: frames }, 'reel'), false);
});
