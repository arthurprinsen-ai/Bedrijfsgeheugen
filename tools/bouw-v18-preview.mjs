import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const OPENART_SOURCE_URL = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4';
const EXPECTED_OPENART_SOURCE_SHA256 = 'd4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0';
const DERIVATIVE_FILE = 'assets/openart-hero-iphone-safe-v1.mp4';
const DERIVATIVE_URL = '/assets/openart-hero-iphone-safe-v1.mp4';
const DRONE_POSTER = 'https://images.pexels.com/videos/36182314/aerial-architecture-building-business-36182314.jpeg?auto=compress&dpr=1&h=750&w=1260';
const LEGACY_PEOPLE_IMAGE = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const HERO_SOURCE_MANIFEST = 'assets/hero-openart-source.json';
const PROBE_SCRIPT = '<script defer src="/assets/runtime-evidence-probe.js"></script>';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const fraction = value => {
  const [n,d='1'] = String(value || '0').split('/').map(Number);
  return d ? n/d : 0;
};
const faststart = buffer => {
  const moov = buffer.indexOf(Buffer.from('moov'));
  const mdat = buffer.indexOf(Buffer.from('mdat'));
  return moov >= 0 && mdat >= 0 && moov < mdat;
};
const probe = async file => {
  const result = spawnSync(ffprobeStatic.path, [
    '-v','error','-show_entries','stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate','-of','json',file
  ], { encoding:'utf8' });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${file}: ${result.stderr || result.stdout}`);
  const parsed = JSON.parse(result.stdout || '{}');
  const streams = parsed.streams || [];
  const video = streams.find(s => s.codec_type === 'video');
  if (!video) throw new Error(`No video stream in ${file}`);
  const bytes = await readFile(file);
  return {
    width: Number(video.width),
    height: Number(video.height),
    fps: fraction(video.r_frame_rate),
    codec: String(video.codec_name || '').toLowerCase(),
    pixel_format: String(video.pix_fmt || '').toLowerCase(),
    has_audio: streams.some(s => s.codec_type === 'audio'),
    faststart: faststart(bytes)
  };
};
const assertDerivative = p => {
  const expected = {width:1920,height:1080,fps:30,codec:'h264',pixel_format:'yuv420p',has_audio:false,faststart:true};
  for (const [key,value] of Object.entries(expected)) {
    if (p[key] !== value) throw new Error(`OpenArt derivative contract mismatch: ${key}=${p[key]} expected ${value}`);
  }
};

const temp = await mkdtemp(join(tmpdir(), 'bg-openart-'));
const sourceFile = join(temp, 'openart-source.mp4');
try {
  const response = await fetch(OPENART_SOURCE_URL, { cache:'no-store' });
  if (!response.ok) throw new Error(`OpenArt source download failed: HTTP ${response.status}`);
  const sourceBytes = Buffer.from(await response.arrayBuffer());
  const sourceSha = sha256(sourceBytes);
  if (sourceSha !== EXPECTED_OPENART_SOURCE_SHA256) throw new Error(`OpenArt source hash drift: ${sourceSha}`);
  await writeFile(sourceFile, sourceBytes);
  const sourceProbe = await probe(sourceFile);

  const transcode = spawnSync(ffmpegPath, [
    '-y','-i',sourceFile,
    '-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
    '-c:v','libx264','-pix_fmt','yuv420p','-an','-movflags','+faststart','-vsync','cfr',
    DERIVATIVE_FILE
  ], { encoding:'utf8' });
  if (transcode.status !== 0) throw new Error(`OpenArt transcode failed: ${transcode.stderr || transcode.stdout}`);

  const derivativeBytes = await readFile(DERIVATIVE_FILE);
  const derivativeProbe = await probe(DERIVATIVE_FILE);
  assertDerivative(derivativeProbe);
  const derivativeSha = sha256(derivativeBytes);
  await writeFile(HERO_SOURCE_MANIFEST, JSON.stringify({
    source_url: OPENART_SOURCE_URL,
    source_sha256: sourceSha,
    source_probe: sourceProbe,
    derivative_url: DERIVATIVE_URL,
    derivative_sha256: derivativeSha,
    derivative_probe: derivativeProbe,
    iphone_runtime_status: 'pending'
  }, null, 2) + '\n', 'utf8');

  const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
  const base64 = parts.join('').replace(/\s+/g, '');
  if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
  if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
  let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
  if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);
  if (!html.includes('id="v18-4-video-controller"')) throw new Error('Canonical proven V18 controller missing');

  const heroMatch = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/);
  if (!heroMatch) throw new Error('Canonical hero video element missing');
  let hero = heroMatch[0];
  hero = hero.replace(/poster="[^"]*"/, `poster="${DRONE_POSTER}"`);
  hero = hero.replace(/<source\s+src="[^"]+"\s+type="video\/mp4"\s*\/?>/, `<source src="${DERIVATIVE_URL}" type="video/mp4">`);
  if (!hero.includes(DERIVATIVE_URL) || !hero.includes(DRONE_POSTER)) throw new Error('Hero media swap failed');
  html = html.replace(heroMatch[0], hero);
  html = html.split(LEGACY_PEOPLE_IMAGE).join(DRONE_POSTER);
  if (html.includes(LEGACY_PEOPLE_IMAGE)) throw new Error('Legacy people hero fallback still present');

  if (!html.includes('</body>')) throw new Error('V18 body closing tag missing for runtime probe injection');
  if (html.includes('/assets/runtime-evidence-probe.js')) throw new Error('Runtime evidence probe already present before controlled injection');
  html = html.replace('</body>', `${PROBE_SCRIPT}</body>`);
  await writeFile('prototype-v18-stable.html', html, 'utf8');
  console.log(`V18 OpenArt preview built: canonical controller frozen; derivative_sha256=${derivativeSha}; runtime_state=VERIFY_IPHONE_RUNTIME`);
} finally {
  await rm(temp, { recursive:true, force:true });
}
