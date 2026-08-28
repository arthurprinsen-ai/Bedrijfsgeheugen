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
const CONTROL_SOURCE = 'https://videos.pexels.com/video-files/35649915/15107522_1920_1080_30fps.mp4';
const ORIGINAL_POSTER = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const HERO_SOURCE_URL = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-1e5fd189-ae01-9b05-b8b8-b0d05a1f7f52_1787916876752_794b55dd.mp4';
const HERO_SOURCE_PATH = 'assets/inspirational-hero-v4-source.mp4';
const HERO_PATH = 'assets/inspirational-hero-v4.mp4';
const HERO_MANIFEST_PATH = 'assets/inspirational-hero-v4.integrity.txt';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// Build the approved generated drone clip as a lightweight Safari-compatible local MP4.
const heroResponse = await fetch(HERO_SOURCE_URL, { cache: 'no-store' });
if (!heroResponse.ok) throw new Error(`Hero source download failed: HTTP ${heroResponse.status}`);
const sourceBytes = Buffer.from(await heroResponse.arrayBuffer());
if (sourceBytes.length < 1000000) throw new Error(`Hero source unexpectedly small: ${sourceBytes.length} bytes`);
if (sourceBytes.subarray(4,8).toString('ascii') !== 'ftyp') throw new Error('Hero source is not a valid MP4');
await writeFile(HERO_SOURCE_PATH, sourceBytes);

if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary path');
await execFileAsync(ffmpegPath, [
  '-y','-i',HERO_SOURCE_PATH,
  '-map','0:v:0','-an',
  '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black',
  '-c:v','libx264','-profile:v','high','-level:v','4.0','-pix_fmt','yuv420p',
  '-preset','medium','-crf','24','-maxrate','2500k','-bufsize','5000k','-movflags','+faststart',
  HERO_PATH
], { maxBuffer: 20 * 1024 * 1024 });

const heroBytes = await readFile(HERO_PATH);
if (heroBytes.length < 300000 || heroBytes.length > 8000000) throw new Error(`Hero web asset size outside expected range: ${heroBytes.length}`);
if (heroBytes.subarray(4,8).toString('ascii') !== 'ftyp') throw new Error('Hero output is not a valid MP4');
const heroHash = sha256(heroBytes);
await writeFile(HERO_MANIFEST_PATH, `bytes=${heroBytes.length}\nsha256=${heroHash}\ncodec=h264\npixel_format=yuv420p\naudio=none\nresolution=1280x720\nsource=${HERO_SOURCE_URL}\n`, 'utf8');
await unlink(HERO_SOURCE_PATH).catch(() => {});

// Reconstruct the exact canonical V18 HTML first.
const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);
if (!html.includes(CONTROL_SOURCE)) throw new Error('Canonical proven Pexels control source missing');
if (!html.includes(ORIGINAL_POSTER)) throw new Error('Canonical proven poster missing');
if (!html.includes('id="v18-4-video-controller"')) throw new Error('Canonical proven V18 controller missing');

// Only change the media source. Poster, attributes, DOM position and proven controller stay byte-for-byte canonical.
html = html.replace(CONTROL_SOURCE, '/assets/inspirational-hero-v4.mp4');

await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable preview built with proven original player + drone-only media swap: ${heroBytes.length} bytes ${heroHash}`);
