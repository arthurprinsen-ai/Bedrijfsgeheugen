import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const HERO_PATH = 'assets/inspirational-hero-v2.mp4';
const HERO_BYTES = 48909;
const HERO_SHA256 = '476e0cfcfb065b01f419dab96ca5f28a20495862716fb34da9db742e9899db2a';

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one hero video');
if (count(html, /id="heroBackgroundMotion"/g) !== 0) fail('animated image hero must be removed');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero missing ${attr}`);
if (!hero.includes('preload="auto"')) fail('hero must preload automatically');
if (!hero.includes('/assets/inspirational-hero-v2.mp4')) fail('hero must use exact same-origin iPhone-approved v2 asset');
if (!hero.includes('type="video/mp4"')) fail('hero source must declare video/mp4');
if (html.includes('id="heroVideoFallback"')) fail('baseline must not ship fallback controls');
if (html.includes('v18-stable-video-controller')) fail('baseline must not ship custom playback controller');

const heroWindowStart = Math.max(0, html.indexOf('id="heroBackgroundVideo"') - 1200);
const heroWindowEnd = Math.min(html.length, html.indexOf('id="heroBackgroundVideo"') + 4000);
const heroWindow = html.slice(heroWindowStart, heroWindowEnd);
for (const forbidden of ['playbackRate','.play(','.pause(','IntersectionObserver']) {
  if (heroWindow.includes(forbidden)) fail(`baseline must preserve simple native playback; forbidden token: ${forbidden}`);
}

const heroStat = await stat(HERO_PATH);
if (heroStat.size !== HERO_BYTES) fail(`approved hero v2 size ${heroStat.size}, expected ${HERO_BYTES}`);
const heroBytes = await readFile(HERO_PATH);
if (heroBytes.subarray(4,8).toString('ascii') !== 'ftyp') fail('approved hero v2 is not a valid MP4');
const heroHash = sha256(heroBytes);
if (heroHash !== HERO_SHA256) fail(`approved hero v2 SHA mismatch: ${heroHash}`);

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);
const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log(`V18 preview QA PASS — exact iPhone-approved same-origin hero v2 ${heroStat.size} bytes ${heroHash}, 14 views, ${targets.length} routes, ${hrefs.length} HTTPS anchors`);
