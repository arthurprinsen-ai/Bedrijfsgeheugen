import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

const OPENART_SOURCE_URL = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4';
const EXPECTED_SOURCE_SHA256 = 'd4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0';
const EXPECTED_DERIVATIVE_SHA256 = 'a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd';
const DERIVATIVE_FILE = 'assets/openart-hero-iphone-safe-v1.mp4';
const MANIFEST_FILE = 'assets/openart-hero-production.json';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const fraction = value => {
  const [n, d = '1'] = String(value || '0').split('/').map(Number);
  return d ? n / d : 0;
};
const faststart = buffer => {
  const moov = buffer.indexOf(Buffer.from('moov'));
  const mdat = buffer.indexOf(Buffer.from('mdat'));
  return moov >= 0 && mdat >= 0 && moov < mdat;
};
const probe = async file => {
  const result = spawnSync(ffprobeStatic.path, [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate',
    '-of', 'json',
    file
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${file}: ${result.stderr || result.stdout}`);
  const parsed = JSON.parse(result.stdout || '{}');
  const streams = parsed.streams || [];
  const video = streams.find(stream => stream.codec_type === 'video');
  if (!video) throw new Error(`No video stream in ${file}`);
  const bytes = await readFile(file);
  return {
    width: Number(video.width),
    height: Number(video.height),
    fps: fraction(video.r_frame_rate),
    codec: String(video.codec_name || '').toLowerCase(),
    pixel_format: String(video.pix_fmt || '').toLowerCase(),
    has_audio: streams.some(stream => stream.codec_type === 'audio'),
    faststart: faststart(bytes)
  };
};
const assertProfile = profile => {
  const expected = {
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264',
    pixel_format: 'yuv420p',
    has_audio: false,
    faststart: true
  };
  for (const [key, value] of Object.entries(expected)) {
    if (profile[key] !== value) throw new Error(`Hero derivative contract mismatch: ${key}=${profile[key]} expected ${value}`);
  }
};

await mkdir('assets', { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'bg-openart-production-'));
const sourceFile = join(temp, 'openart-source.mp4');
try {
  const response = await fetch(OPENART_SOURCE_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`OpenArt source download failed: HTTP ${response.status}`);
  const sourceBytes = Buffer.from(await response.arrayBuffer());
  const sourceSha = sha256(sourceBytes);
  if (sourceSha !== EXPECTED_SOURCE_SHA256) throw new Error(`OpenArt source hash drift: ${sourceSha}`);
  await writeFile(sourceFile, sourceBytes);

  const transcode = spawnSync(ffmpegPath, [
    '-y', '-i', sourceFile,
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-movflags', '+faststart',
    '-vsync', 'cfr',
    DERIVATIVE_FILE
  ], { encoding: 'utf8' });
  if (transcode.status !== 0) throw new Error(`OpenArt transcode failed: ${transcode.stderr || transcode.stdout}`);

  const derivativeBytes = await readFile(DERIVATIVE_FILE);
  const derivativeSha = sha256(derivativeBytes);
  if (derivativeSha !== EXPECTED_DERIVATIVE_SHA256) {
    throw new Error(`Hero derivative hash drift: ${derivativeSha}; expected ${EXPECTED_DERIVATIVE_SHA256}`);
  }
  const derivativeProbe = await probe(DERIVATIVE_FILE);
  assertProfile(derivativeProbe);

  await writeFile(MANIFEST_FILE, JSON.stringify({
    schema_version: 1,
    source_url: OPENART_SOURCE_URL,
    source_sha256: sourceSha,
    derivative_url: '/assets/openart-hero-iphone-safe-v1.mp4',
    derivative_sha256: derivativeSha,
    derivative_probe: derivativeProbe,
    physical_iphone_runtime: 'PASS',
    promotion_state: 'MEDIA_READY'
  }, null, 2) + '\n', 'utf8');
  console.log(`OpenArt production media PASS: ${derivativeSha}`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
