import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');

if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one hero video');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero video missing ${attr}`);
if (!hero.includes('/assets/inspirational-hero-v2.mp4')) fail('hero video must use cache-busted local v2 MP4');

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);

const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

const VIDEO_PATH = 'assets/inspirational-hero-v2.mp4';
const EXPECTED_VIDEO_SIZE = 48909;
const EXPECTED_VIDEO_SHA256 = '476e0cfcfb065b01f419dab96ca5f28a20495862716fb34da9db742e9899db2a';
const videoStat = await stat(VIDEO_PATH);
if (videoStat.size !== EXPECTED_VIDEO_SIZE) fail(`hero video size ${videoStat.size}, expected ${EXPECTED_VIDEO_SIZE}`);
const videoBytes = await readFile(VIDEO_PATH);
if (videoBytes.subarray(4, 8).toString('ascii') !== 'ftyp') fail('hero asset is not a valid MP4 container');
const videoHash = sha256(videoBytes);
if (videoHash !== EXPECTED_VIDEO_SHA256) fail(`hero video integrity mismatch: ${videoHash}`);

console.log(`V18 preview QA PASS — 14 views, ${targets.length} routes, verified video ${videoStat.size} bytes, ${hrefs.length} HTTPS anchors`);
