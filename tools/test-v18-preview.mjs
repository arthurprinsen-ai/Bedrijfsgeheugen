import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const ORIGINAL_HERO_URL = 'https://videos.pexels.com/video-files/35649915/15107522_1920_1080_30fps.mp4';
const ORIGINAL_POSTER_URL = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');
if (sha256(html) !== EXPECTED_HTML_SHA256) fail(`motion control must be untouched canonical V18 HTML; got ${sha256(html)}`);
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one original hero video');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`original hero missing ${attr}`);
if (!hero.includes(ORIGINAL_HERO_URL)) fail('original V18 moving hero URL changed');
if (!hero.includes(ORIGINAL_POSTER_URL)) fail('original V18 poster changed');
if (!hero.includes('type="video/mp4"')) fail('original hero source must declare video/mp4');

const controller = html.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
if (!controller) fail('original v18-4 video controller missing');
for (const required of ['defaultMuted=true','volume=0','playsInline=true','video.play()','DOMContentLoaded','visibilitychange','touchstart']) {
  if (!controller.includes(required)) fail(`original motion controller invariant missing: ${required}`);
}

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);
const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log(`V18 preview QA PASS — untouched original V18 moving-video control, 14 views, ${targets.length} routes, ${hrefs.length} HTTPS anchors`);
