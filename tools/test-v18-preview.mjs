import { readFile, stat } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const HERO_VIDEO = '/assets/hero-openart-v1.mp4';
const HERO_VIDEO_FILE = 'assets/hero-openart-v1.mp4';
const HERO_POSTER = '/assets/hero-openart-v1.jpg';
const HERO_MANIFEST = 'assets/hero-openart-v1.txt';
const OPENART_SOURCE = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4';
const OLD_POSTER = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const manifest = await readFile(HERO_MANIFEST, 'utf8');
const canonicalBase64 = (await Promise.all(FILES.map(path => readFile(path, 'utf8')))).join('').replace(/\s+/g, '');
const canonicalHtml = gunzipSync(Buffer.from(canonicalBase64, 'base64')).toString('utf8');

if (!manifest.includes(`source=${OPENART_SOURCE}`)) fail('OpenArt source manifest mismatch');
if (!manifest.includes('target=1920x1080@30fps')) fail('OpenArt target profile missing from manifest');
if (!manifest.includes('audio=none')) fail('OpenArt no-audio contract missing from manifest');

const videoStat = await stat(HERO_VIDEO_FILE);
if (videoStat.size < 500000) fail(`OpenArt hero video unexpectedly small: ${videoStat.size}`);
const ffmpegOutput = (() => {
  try {
    execFileSync(ffmpegPath, ['-hide_banner','-i',HERO_VIDEO_FILE,'-f','null','-'], { encoding:'utf8', stdio:['ignore','pipe','pipe'] });
    return '';
  } catch (error) {
    return `${error.stdout || ''}\n${error.stderr || ''}`;
  }
})();
const inputSection = ffmpegOutput.split('Output #0')[0];
if (!/Video:\s*h264/i.test(inputSection)) fail('OpenArt hero is not H.264');
if (!/yuv420p/i.test(inputSection)) fail('OpenArt hero is not yuv420p');
if (!/1920x1080/.test(inputSection)) fail('OpenArt hero is not 1920x1080');
if (!/(?:30(?:\.0+)?\s*fps|30\s*tbr)/i.test(inputSection)) fail('OpenArt hero is not 30fps');
if (/Audio:/i.test(inputSection)) fail('OpenArt hero still contains audio');

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
if (!hero) fail('hero video missing');
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero missing ${attr}`);
if (!hero.includes(HERO_VIDEO)) fail('hero does not use optimized OpenArt asset');
if (!hero.includes(HERO_POSTER)) fail('hero does not use matching OpenArt poster');
if (html.includes(OLD_POSTER)) fail('legacy people hero image still present anywhere in generated HTML');

const canonicalController = canonicalHtml.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
const currentController = html.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
if (!canonicalController) fail('canonical V18 controller missing');
if (currentController !== canonicalController) fail('proven V18 controller changed');
if (html.includes('v18-stable-video-controller')) fail('alternate playback controller present');
if (/\b(?:defaultPlaybackRate|playbackRate)\s*=/.test(html)) fail('playback-rate modification present');
if (!html.includes('id="v18-hero-hard-reset"')) fail('hard hero fallback reset missing');
if (!html.includes('id="v18-video-diagnostics"')) fail('iPhone diagnostics missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
for (const target of [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1])) if (!views.has(target)) fail(`missing data-view target: ${target}`);

const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log('V18 preview QA PASS — canonical controller frozen; optimized OpenArt hero is H.264/yuv420p/1920x1080@30fps/no-audio');
