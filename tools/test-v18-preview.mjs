await import('./test-runtime-evidence-probe.mjs');

import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const DRONE_POSTER = 'https://images.pexels.com/videos/36182314/aerial-architecture-building-business-36182314.jpeg?auto=compress&dpr=1&h=750&w=1260';
const SOURCE_MANIFEST = 'assets/hero-pexels-source.txt';
const OLD_POSTER = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const EXPECTED_DOWNLOAD = 'https://www.pexels.com/download/video/8783011/';
const EXPECTED_SOURCE_SUFFIX = '/8783011/8783011-hd_1920_1080_30fps.mp4';
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const sourceManifest = await readFile(SOURCE_MANIFEST, 'utf8');
const downloadSource = sourceManifest.match(/^download=(.+)$/m)?.[1] || '';
const resolvedSource = sourceManifest.match(/^resolved=(.+)$/m)?.[1] || '';
const sourceStatus = Number(sourceManifest.match(/^status=(\d+)$/m)?.[1] || 0);
const contentType = sourceManifest.match(/^content_type=(.+)$/m)?.[1] || '';
const canonicalBase64 = (await Promise.all(FILES.map(path => readFile(path, 'utf8')))).join('').replace(/\s+/g, '');
const canonicalHtml = gunzipSync(Buffer.from(canonicalBase64, 'base64')).toString('utf8');

if (downloadSource !== EXPECTED_DOWNLOAD) fail(`unexpected Pexels source endpoint: ${downloadSource}`);
if (!resolvedSource.startsWith('https://videos.pexels.com/')) fail(`resolved Pexels source invalid: ${resolvedSource}`);
if (!resolvedSource.includes(EXPECTED_SOURCE_SUFFIX)) fail(`hero source is not the proven 1920x1080 30fps delivery: ${resolvedSource}`);
if (![200,206].includes(sourceStatus)) fail(`resolved Pexels source status invalid: ${sourceStatus}`);
if (!/video\/mp4|application\/octet-stream/i.test(contentType)) fail(`resolved Pexels content-type invalid: ${contentType}`);
if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
if (!hero) fail('hero video missing');
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero missing ${attr}`);
if (!hero.includes(resolvedSource)) fail('hero does not use build-resolved Pexels source');
if (!hero.includes(DRONE_POSTER)) fail('matching drone poster missing');
if (html.includes(OLD_POSTER)) fail('legacy people hero image still present anywhere in generated HTML');

const canonicalController = canonicalHtml.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
const currentController = html.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
if (!canonicalController) fail('canonical V18 controller missing');
if (currentController !== canonicalController) fail('proven V18 controller changed');
if (html.includes('v18-stable-video-controller')) fail('alternate playback controller present');
if (/\b(?:defaultPlaybackRate|playbackRate)\s*=/.test(html)) fail('playback-rate modification present during iPhone recovery');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
for (const target of [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1])) if (!views.has(target)) fail(`missing data-view target: ${target}`);

const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log(`V18 preview QA PASS — canonical controller frozen; official Pexels source resolved to 1920x1080@30fps: ${resolvedSource}`);
