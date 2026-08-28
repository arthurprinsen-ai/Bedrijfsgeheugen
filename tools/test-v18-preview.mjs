await import('./test-runtime-evidence-probe.mjs');

import { readFile, stat } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const DRONE_POSTER = 'https://images.pexels.com/videos/36182314/aerial-architecture-building-business-36182314.jpeg?auto=compress&dpr=1&h=750&w=1260';
const OLD_POSTER = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const SOURCE_URL = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4';
const SOURCE_SHA256 = 'd4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0';
const DERIVATIVE_URL = '/assets/openart-hero-iphone-safe-v1.mp4';
const SOURCE_MANIFEST = 'assets/hero-openart-source.json';
const PROBE_SCRIPT = '<script defer src="/assets/runtime-evidence-probe.js"></script>';
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const manifest = JSON.parse(await readFile(SOURCE_MANIFEST, 'utf8'));
const canonicalBase64 = (await Promise.all(FILES.map(path => readFile(path, 'utf8')))).join('').replace(/\s+/g, '');
const canonicalHtml = gunzipSync(Buffer.from(canonicalBase64, 'base64')).toString('utf8');

if (manifest.source_url !== SOURCE_URL) fail(`unexpected OpenArt source URL: ${manifest.source_url}`);
if (manifest.source_sha256 !== SOURCE_SHA256) fail(`unexpected OpenArt source hash: ${manifest.source_sha256}`);
if (manifest.derivative_url !== DERIVATIVE_URL) fail(`unexpected derivative URL: ${manifest.derivative_url}`);
if (!/^[a-f0-9]{64}$/.test(manifest.derivative_sha256 || '')) fail('derivative SHA-256 missing');
const target = manifest.derivative_probe || {};
for (const [key, expected] of Object.entries({width:1920,height:1080,fps:30,codec:'h264',pixel_format:'yuv420p',has_audio:false,faststart:true})) {
  if (target[key] !== expected) fail(`derivative ${key}=${target[key]} expected ${expected}`);
}
if (!(await stat('assets/openart-hero-iphone-safe-v1.mp4')).size) fail('normalized OpenArt derivative missing or empty');
if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');
if (html.split(PROBE_SCRIPT).length - 1 !== 1) fail('expected exactly one deferred runtime evidence probe script');

const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
if (!hero) fail('hero video missing');
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero missing ${attr}`);
if (!hero.includes(DERIVATIVE_URL)) fail('hero does not use normalized local OpenArt derivative');
if (!hero.includes(DRONE_POSTER)) fail('baseline drone poster changed');
if (html.includes(OLD_POSTER)) fail('legacy people hero image still present anywhere in generated HTML');

const canonicalController = canonicalHtml.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
const currentController = html.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
if (!canonicalController) fail('canonical V18 controller missing');
if (currentController !== canonicalController) fail('proven V18 controller changed');
if (html.includes('v18-stable-video-controller')) fail('alternate playback controller present');
if (/\b(?:defaultPlaybackRate|playbackRate)\s*=/.test(html)) fail('playback-rate modification present during iPhone recovery');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
for (const targetView of [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1])) if (!views.has(targetView)) fail(`missing data-view target: ${targetView}`);

const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log(`V18 OpenArt preview QA PASS — canonical controller frozen; derivative ${manifest.derivative_sha256}`);
