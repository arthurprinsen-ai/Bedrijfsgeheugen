import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Hero-video-contract zoals de build hem nu opbouwt:
// 1. bouw-v18-production-core zet de goedgekeurde OpenArt-afgeleide in de
//    herstelde V18-homepage (iPhone-geteste basis);
// 2. bouw-v18-chrome-alles vervangt die bewust door HERO_URL, zodat de homepage
//    dezelfde skyline heeft als elke andere pagina;
// 3. HERO_URL is een lokale, iPhone-veilige afgeleide: faststart, geen audio,
//    H.264 yuv420p, met een manifest waarvan de hash klopt.
// Tot 10 sept 2026 las deze test de bron-index.html, die de hero-video niet
// meer bevat (de homepage wordt bij elke build uit de payload hersteld).
const fail = message => { throw new Error(`Homepage hero video regression: ${message}`); };
const sha = buf => createHash('sha256').update(buf).digest('hex');

function faststart(buf) {
  const moov = buf.indexOf(Buffer.from('moov'));
  const mdat = buf.indexOf(Buffer.from('mdat'));
  return moov >= 0 && (mdat < 0 || moov < mdat);
}

const openart = JSON.parse(await readFile('assets/openart-hero-production.json', 'utf8'));
if (openart.derivative_sha256 !== 'a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd') fail('accepted OpenArt derivative hash changed');
if (openart.physical_iphone_runtime !== 'PASS') fail('OpenArt physical iPhone acceptance is not PASS');
if (openart.derivative_url !== '/assets/openart-hero-iphone-safe-v1.mp4') fail('OpenArt manifest derivative URL changed');

const core = await readFile('tools/bouw-v18-production-core.mjs', 'utf8');
if (!core.includes("const HERO_URL = '/assets/openart-hero-iphone-safe-v1.mp4';")) fail('production core no longer seeds the accepted OpenArt derivative');
if (!/id="heroBackgroundVideo"[^>]*autoplay[^>]*muted[^>]*playsinline[^>]*loop/.test(core)) fail('hero video lost autoplay/muted/playsinline/loop');

const alles = await readFile('tools/bouw-v18-chrome-alles.mjs', 'utf8');
if (!alles.includes('openart-hero-iphone-safe-v1') || !alles.includes('HERO_URL')) fail('homepage no longer swaps to the site-wide skyline');

const chrome = await readFile('tools/bouw-v18-chrome.mjs', 'utf8');
const heroUrl = (chrome.match(/export const HERO_URL = '([^']+)'/) || [])[1];
if (!heroUrl) fail('HERO_URL missing');
if (!heroUrl.startsWith('/assets/')) fail(`HERO_URL must be a local asset, got ${heroUrl}`);

const manifest = JSON.parse(await readFile('assets/hero-shanghai-production.json', 'utf8'));
if (manifest.derivative_url !== heroUrl) fail('site-wide hero manifest does not describe HERO_URL');
const video = await readFile(heroUrl.slice(1));
if (sha(video) !== manifest.derivative_sha256) fail('site-wide hero file does not match its manifest hash');
if (!faststart(video)) fail('site-wide hero is not faststart (moov must precede mdat)');
const p = manifest.derivative_probe || {};
if (p.codec !== 'h264' || p.pixel_format !== 'yuv420p' || p.has_audio !== false || p.faststart !== true) fail('site-wide hero probe is not iPhone-safe');
if (video.length > 6 * 1024 * 1024) fail(`site-wide hero is ${video.length} bytes; keep it under 6 MB`);

console.log(`Homepage hero video contract OK: ${heroUrl} (${video.length} bytes, faststart, no audio)`);
