import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePromotion } from '../scripts/production/promotion-controller.mjs';

const base = {
  fingerprint: 'production|candidate|abc',
  owner_agent: '09',
  candidate_branch: 'automation/example',
  candidate_sha: 'candidate123',
  tested_head_sha: 'candidate123',
  base_sha: 'main123',
  current_main_sha: 'main123',
  last_known_good_sha: 'main123',
  last_known_good_deploy_id: 'deploy-old',
  current_hypothesis: 'fix build',
  retry_count_for_hypothesis: 0,
  hard_boundary: false,
  ci_status: 'green',
  preview_status: 'green',
  rollback_ready: true,
  production_status: 'not_started'
};

test('green exact candidate is ready for exact-SHA promotion', () => {
  assert.deepEqual(evaluatePromotion(base), {
    state: 'PROMOTION_READY',
    action: 'PROMOTE_EXACT_SHA',
    candidate_sha: 'candidate123'
  });
});

test('red candidate routes to repair rather than terminal failure', () => {
  const r = evaluatePromotion({ ...base, ci_status: 'red', retry_count_for_hypothesis: 1 });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'REPAIR');
});

test('two identical failed retries force a new hypothesis', () => {
  const r = evaluatePromotion({ ...base, preview_status: 'red', retry_count_for_hypothesis: 2 });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'CHANGE_HYPOTHESIS');
});

test('candidate head drift blocks promotion and requires re-verification', () => {
  const r = evaluatePromotion({ ...base, tested_head_sha: 'older123' });
  assert.equal(r.action, 'VERIFY_CANDIDATE');
});

test('main drift requires candidate re-verification before promotion', () => {
  const r = evaluatePromotion({ ...base, current_main_sha: 'main-new' });
  assert.equal(r.action, 'VERIFY_CANDIDATE');
});

test('production red requires deterministic rollback', () => {
  const r = evaluatePromotion({ ...base, production_status: 'red', production_sha: 'candidate123' });
  assert.equal(r.state, 'ROLLBACK_REQUIRED');
  assert.equal(r.action, 'ROLLBACK_LAST_KNOWN_GOOD');
  assert.equal(r.rollback_sha, 'main123');
});

test('verified production exact SHA becomes green', () => {
  const r = evaluatePromotion({
    ...base,
    production_status: 'green',
    production_sha: 'candidate123',
    production_deploy_status: 'ready'
  });
  assert.equal(r.state, 'PRODUCTION_GREEN');
  assert.equal(r.action, 'PRODUCTION_GREEN');
});

test('hard boundary is the only blocking terminal state', () => {
  const r = evaluatePromotion({ ...base, hard_boundary: true, hard_boundary_reason: 'secret change required' });
  assert.equal(r.state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(r.action, 'BLOCKED_HARD_BOUNDARY');
});

test('unsafe raw hero media is normalization-required and cannot promote', () => {
  const r = evaluatePromotion({
    ...base,
    media_contract_required: true,
    media_source: {
      width: 1920,
      height: 1088,
      fps: 24,
      codec: 'h264',
      pixel_format: 'yuv420p',
      has_audio: true,
      faststart: false
    }
  });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'NORMALIZE_MEDIA');
});

test('normalized media without validation remains in verification', () => {
  const r = evaluatePromotion({
    ...base,
    media_contract_required: true,
    media_source: { width: 1920, height: 1088, fps: 24, has_audio: true },
    media_derivative: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
      pixel_format: 'yuv420p',
      has_audio: false,
      faststart: true
    },
    media_derivative_validated: false
  });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'VERIFY_MEDIA');
});

test('validated derivative still requires iPhone runtime acceptance', () => {
  const r = evaluatePromotion({
    ...base,
    media_contract_required: true,
    media_source: { width: 1920, height: 1088, fps: 24, has_audio: true },
    media_derivative: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
      pixel_format: 'yuv420p',
      has_audio: false,
      faststart: true
    },
    media_derivative_validated: true,
    iphone_runtime_status: 'pending'
  });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'VERIFY_IPHONE_RUNTIME');
});

test('validated iPhone-safe derivative is eligible for normal exact-SHA promotion', () => {
  const r = evaluatePromotion({
    ...base,
    media_contract_required: true,
    media_source: { width: 1920, height: 1088, fps: 24, has_audio: true },
    media_derivative: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
      pixel_format: 'yuv420p',
      has_audio: false,
      faststart: true
    },
    media_derivative_validated: true,
    iphone_runtime_status: 'green'
  });
  assert.equal(r.state, 'PROMOTION_READY');
  assert.equal(r.action, 'PROMOTE_EXACT_SHA');
});
