import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');

if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one hero video');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero video missing ${attr}`);
if (!hero.includes('/assets/inspirational-hero-v4.mp4')) fail('hero video must use same-origin Safari-safe v4 MP4');
if (!/preload="auto"/.test(hero)) fail('hero v4 must preload for fast first paint');
if (!html.includes('video.playbackRate=.65')) fail('hero v4 must use the approved slower cinematic playback rate');

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);

const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

const VIDEO_PATH = 'assets/inspirational-hero-v4.mp4';
const videoStat = await stat(VIDEO_PATH);
if (videoStat.size < 300000 || videoStat.size > 8000000) fail(`hero v4 size outside web-safe range: ${videoStat.size} bytes`);
const videoBytes = await readFile(VIDEO_PATH);
if (videoBytes.subarray(4, 8).toString('ascii') !== 'ftyp') fail('hero v4 is not a valid MP4 container');
const videoHash = sha256(videoBytes);
if (!/^[a-f0-9]{64}$/.test(videoHash)) fail('hero v4 hash invalid');
const manifest = await readFile('assets/inspirational-hero-v4.integrity.txt', 'utf8');
for (const required of [
  `bytes=${videoStat.size}`,
  `sha256=${videoHash}`,
  'codec=h264',
  'pixel_format=yuv420p',
  'audio=none',
  'resolution=1280x720'
]) if (!manifest.includes(required)) fail(`hero v4 manifest missing: ${required}`);

console.log(`V18 preview QA PASS — stable root, 14 views, ${targets.length} routes, Safari-safe hero-v4 ${videoStat.size} bytes ${videoHash}, ${hrefs.length} HTTPS anchors`);
