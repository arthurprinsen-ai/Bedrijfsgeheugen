import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHeroMediaPlan,
  validateHeroMediaProbe
} from '../scripts/media/hero-media-normalizer.mjs';

const unsafeOpenArt = {
  width: 1920,
  height: 1088,
  fps: 24,
  codec: 'h264',
  pixel_format: 'yuv420p',
  has_audio: true,
  faststart: false
};

test('OpenArt-like source gets deterministic iPhone-safe ffmpeg plan', () => {
  const plan = buildHeroMediaPlan({
    input: 'openart-source.mp4',
    output: 'hero-normalized.mp4',
    source: unsafeOpenArt
  });

  assert.equal(plan.action, 'TRANSCODE');
  assert.deepEqual(plan.target, {
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264',
    pixel_format: 'yuv420p',
    has_audio: false,
    faststart: true
  });
  assert.deepEqual(plan.args, [
    '-y',
    '-i', 'openart-source.mp4',
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-movflags', '+faststart',
    '-vsync', 'cfr',
    'hero-normalized.mp4'
  ]);
});

test('already-safe source is not transcoded again', () => {
  const safe = {
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264',
    pixel_format: 'yuv420p',
    has_audio: false,
    faststart: true
  };
  const plan = buildHeroMediaPlan({ input: 'safe.mp4', output: 'unused.mp4', source: safe });
  assert.equal(plan.action, 'USE_SOURCE');
  assert.deepEqual(plan.target, safe);
  assert.deepEqual(plan.args, []);
});

test('validator accepts only exact iPhone-safe derivative probe', () => {
  assert.deepEqual(validateHeroMediaProbe({
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264',
    pixel_format: 'yuv420p',
    has_audio: false,
    faststart: true
  }), { valid: true, failures: [] });
});

test('validator reports every contract mismatch on unsafe derivative', () => {
  const result = validateHeroMediaProbe({
    width: 1920,
    height: 1088,
    fps: 24,
    codec: 'hevc',
    pixel_format: 'yuv422p10le',
    has_audio: true,
    faststart: false
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.failures, [
    'height',
    'fps',
    'codec',
    'pixel_format',
    'has_audio',
    'faststart'
  ]);
});
