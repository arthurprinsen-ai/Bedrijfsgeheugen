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

if (count(html, /id="heroBackgroundVideo"/g) !== 0) fail('hero v8 must not depend on HTML video');
if (count(html, /id="heroBackgroundMotion"/g) !== 1) fail('expected exactly one animated hero image');
const hero = html.match(/<img[^>]*id="heroBackgroundMotion"[^>]*>/)?.[0] || '';
if (!hero.includes('/assets/inspirational-hero-v8.webp')) fail('hero v8 must use cache-busted same-origin animated WebP');
if (!hero.includes('loading="eager"')) fail('hero v8 must load eagerly');
if (!hero.includes('fetchpriority="high"')) fail('hero v8 must have high fetch priority');
if (html.includes('id="heroVideoFallback"')) fail('hero v8 must not ship video fallback controls');
if (html.includes('v18-stable-video-controller')) fail('hero v8 must not ship a video controller');

const heroWindowStart = Math.max(0, html.indexOf('id="heroBackgroundMotion"') - 1200);
const heroWindowEnd = Math.min(html.length, html.indexOf('id="heroBackgroundMotion"') + 4000);
const heroWindow = html.slice(heroWindowStart, heroWindowEnd);
for (const forbidden of ['autoplay','playsinline','playbackRate','.play(','.pause(']) {
  if (heroWindow.includes(forbidden)) fail(`animated hero v8 must not depend on video runtime token: ${forbidden}`);
}

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);
const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

const HERO_PATH = 'assets/inspirational-hero-v8.webp';
const POSTER_PATH = 'assets/inspirational-hero-v8-poster.jpg';
const heroStat = await stat(HERO_PATH);
const posterStat = await stat(POSTER_PATH);
if (heroStat.size < 200000) fail(`hero v8 unexpectedly small: ${heroStat.size} bytes`);
if (heroStat.size > 12000000) fail(`hero v8 exceeds 12 MB animated image budget: ${heroStat.size} bytes`);
if (posterStat.size < 10000) fail(`hero v8 poster unexpectedly small: ${posterStat.size} bytes`);
const heroBytes = await readFile(HERO_PATH);
if (heroBytes.subarray(0, 4).toString('ascii') !== 'RIFF') fail('hero v8 is not a RIFF container');
if (heroBytes.subarray(8, 12).toString('ascii') !== 'WEBP') fail('hero v8 is not WebP');
const heroHash = sha256(heroBytes);
if (!/^[a-f0-9]{64}$/.test(heroHash)) fail('hero v8 hash invalid');
const manifest = await readFile('assets/inspirational-hero-v8.integrity.txt','utf8');
if (!manifest.includes('format=animated-webp')) fail('hero v8 manifest must declare animated WebP');
if (!manifest.includes(`bytes=${heroStat.size}`)) fail('hero v8 manifest size mismatch');
if (!manifest.includes(`sha256=${heroHash}`)) fail('hero v8 manifest hash mismatch');
if (!manifest.includes('autoplay-policy=not-applicable')) fail('hero v8 must explicitly document no autoplay dependency');

console.log(`V18 preview QA PASS — stable root, 14 views, ${targets.length} routes, animated WebP hero-v8 ${heroStat.size} bytes ${heroHash}, no HTML video/autoplay dependency, ${hrefs.length} HTTPS anchors`);
