import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildHeroMediaPlan, validateHeroMediaProbe } from './hero-media-normalizer.mjs';

export function buildFfprobeArgs(file) {
  if (!file) throw new Error('file is required');
  return ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file];
}

function parseRate(value) {
  const raw = String(value || '0/1');
  const [n, d] = raw.split('/').map(Number);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0;
  return n / d;
}

export function parseHeroMediaProbe(raw = {}, { faststart = false } = {}) {
  const streams = Array.isArray(raw.streams) ? raw.streams : [];
  const video = streams.find(stream => stream.codec_type === 'video') || {};
  const audio = streams.find(stream => stream.codec_type === 'audio');

  return {
    width: Number(video.width || 0),
    height: Number(video.height || 0),
    fps: parseRate(video.avg_frame_rate || video.r_frame_rate),
    codec: String(video.codec_name || '').toLowerCase(),
    pixel_format: String(video.pix_fmt || '').toLowerCase(),
    has_audio: Boolean(audio),
    faststart: Boolean(faststart)
  };
}

export function hasFaststart(file) {
  const bytes = readFileSync(file);
  const moov = bytes.indexOf(Buffer.from('moov'));
  const mdat = bytes.indexOf(Buffer.from('mdat'));
  return moov >= 0 && (mdat < 0 || moov < mdat);
}

export function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function buildPromotionMediaState({
  sourceProbe,
  derivativeProbe,
  sourceSha256,
  derivativeSha256,
  derivativePath
} = {}) {
  const validation = validateHeroMediaProbe(derivativeProbe || {});
  return {
    media_contract_required: true,
    media_source: sourceProbe || null,
    media_derivative: derivativeProbe || null,
    media_source_sha256: sourceSha256 || null,
    media_derivative_sha256: derivativeSha256 || null,
    media_derivative_path: derivativePath || null,
    media_derivative_validated: validation.valid,
    media_validation_failures: validation.failures,
    iphone_runtime_status: 'pending'
  };
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${String(result.stderr || '').trim()}`);
  }
  return result.stdout;
}

export function probeFile(file) {
  const stdout = run('ffprobe', buildFfprobeArgs(file));
  return parseHeroMediaProbe(JSON.parse(stdout), { faststart: hasFaststart(file) });
}

export function executeHeroMediaPipeline({ input, output } = {}) {
  if (!input) throw new Error('input is required');
  const sourcePath = resolve(input);
  const sourceProbe = probeFile(sourcePath);
  const sourceSha256 = sha256File(sourcePath);
  const plan = buildHeroMediaPlan({ input: sourcePath, output: output ? resolve(output) : undefined, source: sourceProbe });

  let derivativePath = sourcePath;
  if (plan.action === 'TRANSCODE') {
    run('ffmpeg', plan.args);
    derivativePath = plan.output;
  }

  const derivativeProbe = probeFile(derivativePath);
  const derivativeSha256 = sha256File(derivativePath);
  const promotionState = buildPromotionMediaState({
    sourceProbe,
    derivativeProbe,
    sourceSha256,
    derivativeSha256,
    derivativePath
  });

  return {
    action: plan.action,
    source_path: sourcePath,
    derivative_path: derivativePath,
    source_sha256: sourceSha256,
    derivative_sha256: derivativeSha256,
    source_probe: sourceProbe,
    derivative_probe: derivativeProbe,
    promotion_state: promotionState
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];
  const output = process.argv[3];
  try {
    const result = executeHeroMediaPipeline({ input, output });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.promotion_state.media_derivative_validated ? 0 : 2);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
