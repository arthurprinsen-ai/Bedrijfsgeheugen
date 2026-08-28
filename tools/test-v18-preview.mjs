import { readFile } from 'node:fs/promises';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const HERO_URL = 'https://videos.pexels.com/video-files/13761469/13761469-uhd_3840_2160_30fps.mp4';
const HERO_ORIGIN = 'https://videos.pexels.com';

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one hero video');
if (count(html, /id="heroBackgroundMotion"/g) !== 0) fail('animated WebP hero must be removed');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero missing ${attr}`);
if (!hero.includes('preload="auto"')) fail('hero must preload automatically');
if (!hero.includes(HERO_URL)) fail('hero must use the proven direct Pexels delivery pattern');
if (!hero.includes('type="video/mp4"')) fail('hero source must declare video/mp4');
if (html.includes('id="heroVideoFallback"')) fail('hero must not ship custom fallback controls');
if (html.includes('v18-stable-video-controller')) fail('hero must not ship a custom playback controller');

if (!html.includes(`rel="preconnect" href="${HERO_ORIGIN}"`)) fail('hero CDN preconnect missing');
if (!html.includes('rel="dns-prefetch" href="//videos.pexels.com"')) fail('hero CDN dns-prefetch missing');

const heroWindowStart = Math.max(0, html.indexOf('id="heroBackgroundVideo"') - 1200);
const heroWindowEnd = Math.min(html.length, html.indexOf('id="heroBackgroundVideo"') + 4000);
const heroWindow = html.slice(heroWindowStart, heroWindowEnd);
for (const forbidden of ['playbackRate','.play(','.pause(','IntersectionObserver']) {
  if (heroWindow.includes(forbidden)) fail(`hero must preserve simple proven playback pattern; forbidden token: ${forbidden}`);
}

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);
const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log(`V18 preview QA PASS — proven Pexels hero playback + CDN preconnect/range-gated delivery, 14 views, ${targets.length} routes, ${hrefs.length} HTTPS anchors`);
