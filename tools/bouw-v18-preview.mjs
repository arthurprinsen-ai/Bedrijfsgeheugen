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
const HERO_SOURCE_PATH = 'assets/inspirational-hero-v7-source.mp4';
const HERO_PATH = 'assets/inspirational-hero-v7.mp4';
const HERO_POSTER_PATH = 'assets/inspirational-hero-v7-poster.jpg';
const HERO_MANIFEST_PATH = 'assets/inspirational-hero-v7.integrity.txt';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// V7 follows the browser-native Framer/Neno pattern:
// pre-optimized MP4 + poster + native muted autoplay/loop/playsinline.
// No runtime play(), pause(), IntersectionObserver, playbackRate or visibility controller.
const heroResponse = await fetch(HERO_SOURCE_URL, { cache: 'no-store' });
if (!heroResponse.ok) throw new Error(`Hero v7 source download failed: HTTP ${heroResponse.status}`);
const sourceBytes = Buffer.from(await heroResponse.arrayBuffer());
if (sourceBytes.length < 1000000) throw new Error(`Hero v7 source unexpectedly small: ${sourceBytes.length} bytes`);
if (sourceBytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hero v7 source is not a valid MP4 container');
await writeFile(HERO_SOURCE_PATH, sourceBytes);

if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary path');
const { stderr: ffmpegLog } = await execFileAsync(ffmpegPath, [
  '-y','-i',HERO_SOURCE_PATH,
  '-map','0:v:0','-an',
  '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black',
  '-c:v','libx264','-profile:v','main','-level:v','3.1','-pix_fmt','yuv420p',
  '-preset','medium','-crf','25','-maxrate','2200k','-bufsize','4400k','-movflags','+faststart',
  HERO_PATH
], { maxBuffer: 20 * 1024 * 1024 });
await execFileAsync(ffmpegPath, [
  '-y','-ss','0.25','-i',HERO_PATH,'-frames:v','1','-q:v','3',HERO_POSTER_PATH
], { maxBuffer: 20 * 1024 * 1024 });

const heroBytes = await readFile(HERO_PATH);
if (heroBytes.length < 250000 || heroBytes.length > 5000000) throw new Error(`Hero v7 must stay below 5 MB loop budget: ${heroBytes.length} bytes`);
if (heroBytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hero v7 output is not a valid MP4 container');
if (!/Video:\s*h264/i.test(ffmpegLog)) throw new Error('Hero v7 transcode did not report H.264 output');
if (!/yuv420p/i.test(ffmpegLog)) throw new Error('Hero v7 transcode did not report yuv420p output');
const posterBytes = await readFile(HERO_POSTER_PATH);
if (posterBytes.length < 10000) throw new Error(`Hero v7 poster unexpectedly small: ${posterBytes.length} bytes`);
const heroHash = sha256(heroBytes);
await writeFile(HERO_MANIFEST_PATH,
  `bytes=${heroBytes.length}\nsha256=${heroHash}\ncodec=h264\nprofile=main\nlevel=3.1\npixel_format=yuv420p\naudio=none\nresolution=1280x720\nposter=${HERO_POSTER_PATH}\npattern=native-video-no-js\nsource=${HERO_SOURCE_URL}\n`,
  'utf8'
);
await unlink(HERO_SOURCE_PATH).catch(() => {});

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

const video = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="auto" poster="/assets/inspirational-hero-v7-poster.jpg" aria-hidden="true">
  <source src="/assets/inspirational-hero-v7.mp4" type="video/mp4">
</video>`;
html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, video);
html = html.replace(/<button[^>]*id="heroVideoFallback"[^>]*>[\s\S]*?<\/button>\s*/, '');
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<script id="v18-stable-video-controller">[\s\S]*?<\/script>\s*/, '');

const videoFix = `<style id="v18-stable-video-fix">
.hero-video{background:#dbe7ee;overflow:hidden;position:relative}
.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.08) saturate(.94);pointer-events:none}
@media(max-width:768px){.hero-bg-video{object-position:center center!important}}
</style>`;
html = html.replace('</body>', `${videoFix}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable static preview built: ${Buffer.byteLength(html)} bytes; native Neno-style hero-v7 ${heroBytes.length} bytes ${heroHash}; poster ${posterBytes.length} bytes`);
