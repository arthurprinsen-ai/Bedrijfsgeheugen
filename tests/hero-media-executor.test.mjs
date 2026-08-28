import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHeroMediaProbe,
  buildPromotionMediaState,
  buildFfprobeArgs
} from '../scripts/media/hero-media-executor.mjs';

test('ffprobe JSON is normalized into the media contract shape', () => {
  const probe = parseHeroMediaProbe({
    streams: [
      { codec_type: 'video', codec_name: 'h264', width: 1920, height: 1088, pix_fmt: 'yuv420p', avg_frame_rate: '24/1' },
      { codec_type: 'audio', codec_name: 'aac' }
    ],
    format: { duration: '6.1' }
  }, { faststart: false });

  assert.deepEqual(probe, {
    width: 1920,
    height: 1088,
    fps: 24,
    codec: 'h264',
    pixel_format: 'yuv420p',
    has_audio: true,
    faststart: false
  });
});

test('ffprobe command is deterministic and machine-readable', () => {
  assert.deepEqual(buildFfprobeArgs('hero.mp4'), [
    '-v', 'error',
    '-print_format', 'json',
    '-show_streams',
    '-show_format',
    'hero.mp4'
  ]);
});

test('validated derivative becomes controller-ready media state with hashes', () => {
  const state = buildPromotionMediaState({
    sourceProbe: { width: 1920, height: 1088, fps: 24, codec: 'h264', pixel_format: 'yuv420p', has_audio: true, faststart: false },
    derivativeProbe: { width: 1920, height: 1080, fps: 30, codec: 'h264', pixel_format: 'yuv420p', has_audio: false, faststart: true },
    sourceSha256: 'sourcehash',
    derivativeSha256: 'derivativehash',
    derivativePath: 'hero-normalized.mp4'
  });

  assert.equal(state.media_contract_required, true);
  assert.equal(state.media_derivative_validated, true);
  assert.equal(state.iphone_runtime_status, 'pending');
  assert.equal(state.media_source_sha256, 'sourcehash');
  assert.equal(state.media_derivative_sha256, 'derivativehash');
  assert.equal(state.media_derivative_path, 'hero-normalized.mp4');
});

test('unsafe derivative cannot be marked validated', () => {
  const state = buildPromotionMediaState({
    sourceProbe: { width: 1920, height: 1088, fps: 24, codec: 'h264', pixel_format: 'yuv420p', has_audio: true, faststart: false },
    derivativeProbe: { width: 1920, height: 1088, fps: 24, codec: 'h264', pixel_format: 'yuv420p', has_audio: true, faststart: false },
    sourceSha256: 'sourcehash',
    derivativeSha256: 'badhash',
    derivativePath: 'bad.mp4'
  });
  assert.equal(state.media_derivative_validated, false);
  assert.deepEqual(state.media_validation_failures, ['height', 'fps', 'has_audio', 'faststart']);
});
