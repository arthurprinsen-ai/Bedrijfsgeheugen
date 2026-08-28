import { readFile, writeFile, unlink } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];

const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const HERO_SOURCE_URL = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-1e5fd189-ae01-9b05-b8b8-b0d05a1f7f52_1787916876752_794b55dd.mp4';
const HERO_SOURCE_PATH = 'assets/inspirational-hero-v8-source.mp4';
const HERO_PATH = 'assets/inspirational-hero-v8.webp';
const HERO_POSTER_PATH = 'assets/inspirational-hero-v8-poster.jpg';
const HERO_MANIFEST_PATH = 'assets/inspirational-hero-v8.integrity.txt';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// V8 architectural reset: the moving hero is an animated WebP image, not HTML video.
// This removes iOS autoplay/media-policy/range/codec startup from the runtime path.
const heroResponse = await fetch(HERO_SOURCE_URL, { cache: 'no-store' });
if (!heroResponse.ok) throw new Error(`Hero v8 source download failed: HTTP ${heroResponse.status}`);
const sourceBytes = Buffer.from(await heroResponse.arrayBuffer());
if (sourceBytes.length < 1000000) throw new Error(`Hero v8 source unexpectedly small: ${sourceBytes.length} bytes`);
if (sourceBytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hero v8 source is not a valid MP4 container');
await writeFile(HERO_SOURCE_PATH, sourceBytes);

if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary path');
const { stderr: webpLog } = await execFileAsync(ffmpegPath, [
  '-y','-i',HERO_SOURCE_PATH,
  '-an',
  '-vf','fps=12,scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2:color=#dbe7ee',
  '-c:v','libwebp','-lossless','0','-compression_level','6','-q:v','62','-loop','0',
  HERO_PATH
], { maxBuffer: 30 * 1024 * 1024 });
await execFileAsync(ffmpegPath, [
  '-y','-ss','0.25','-i',HERO_SOURCE_PATH,
  '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=#dbe7ee',
  '-frames:v','1','-q:v','3',HERO_POSTER_PATH
], { maxBuffer: 20 * 1024 * 1024 });

const heroBytes = await readFile(HERO_PATH);
if (heroBytes.length < 200000 || heroBytes.length > 12000000) {
  throw new Error(`Hero v8 animated WebP size outside expected range: ${heroBytes.length} bytes`);
}
if (heroBytes.subarray(0, 4).toString('ascii') !== 'RIFF' || heroBytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error('Hero v8 output is not a valid WebP container');
}
if (!/libwebp|webp/i.test(webpLog)) throw new Error('Hero v8 render did not report WebP output');
const posterBytes = await readFile(HERO_POSTER_PATH);
if (posterBytes.length < 10000) throw new Error(`Hero v8 poster unexpectedly small: ${posterBytes.length} bytes`);
const heroHash = sha256(heroBytes);
await writeFile(HERO_MANIFEST_PATH,
  `bytes=${heroBytes.length}\nsha256=${heroHash}\nformat=animated-webp\nresolution=960x540\nfps=12\nloop=infinite\nautoplay-policy=not-applicable\nposter=${HERO_POSTER_PATH}\nsource=${HERO_SOURCE_URL}\n`,
  'utf8'
);
await unlink(HERO_SOURCE_PATH).catch(() => {});

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

const motion = `<img id="heroBackgroundMotion" class="hero-bg-video" src="/assets/inspirational-hero-v8.webp" alt="" aria-hidden="true" loading="eager" decoding="async" fetchpriority="high">`;
html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, motion);
html = html.replace(/<button[^>]*id="heroVideoFallback"[^>]*>[\s\S]*?<\/button>\s*/, '');
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<script id="v18-stable-video-controller">[\s\S]*?<\/script>\s*/, '');

const motionFix = `<style id="v18-stable-video-fix">
.hero-video{background:#dbe7ee;overflow:hidden;position:relative}
.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.08) saturate(.94);pointer-events:none}
@media(max-width:768px){.hero-bg-video{object-position:center center!important}}
</style>`;
html = html.replace('</body>', `${motionFix}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable static preview built: ${Buffer.byteLength(html)} bytes; animated hero-v8 ${heroBytes.length} bytes ${heroHash}; poster ${posterBytes.length} bytes`);
