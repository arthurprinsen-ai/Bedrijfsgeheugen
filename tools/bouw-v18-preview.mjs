import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];

const HERO_PARTS = [
  'assets/hero-v2-source/chunk-00.txt','assets/hero-v2-source/chunk-01.txt','assets/hero-v2-source/chunk-02.txt',
  'assets/hero-v2-source/chunk-03.txt','assets/hero-v2-source/chunk-04.txt','assets/hero-v2-source/chunk-05.txt',
  'assets/hero-v2-source/chunk-06.txt','assets/hero-v2-source/chunk-07.txt','assets/hero-v2-source/chunk-08.txt'
];

const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const HERO_PATH = 'assets/inspirational-hero-v2.mp4';
const HERO_BYTES = 48909;
const HERO_SHA256 = '476e0cfcfb065b01f419dab96ca5f28a20495862716fb34da9db742e9899db2a';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// Diagnostic baseline: restore the exact same-origin MP4 that was previously
// confirmed to animate on the user's iPhone. No external CDN and no custom playback JS.
const heroTextParts = await Promise.all(HERO_PARTS.map(path => readFile(path, 'utf8')));
const heroBase64 = heroTextParts.join('').replace(/\s+/g, '');
const heroBytes = Buffer.from(heroBase64, 'base64');
if (heroBytes.length !== HERO_BYTES) throw new Error(`Approved hero v2 size ${heroBytes.length}, expected ${HERO_BYTES}`);
if (heroBytes.subarray(4,8).toString('ascii') !== 'ftyp') throw new Error('Approved hero v2 is not a valid MP4');
if (sha256(heroBytes) !== HERO_SHA256) throw new Error(`Approved hero v2 SHA mismatch: ${sha256(heroBytes)}`);
await writeFile(HERO_PATH, heroBytes);

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

const video = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="auto" aria-hidden="true">\n  <source src="/assets/inspirational-hero-v2.mp4" type="video/mp4">\n</video>`;
html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, video);
html = html.replace(/<img[^>]*id="heroBackgroundMotion"[^>]*>/, video);
html = html.replace(/<button[^>]*id="heroVideoFallback"[^>]*>[\s\S]*?<\/button>\s*/, '');
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<script id="v18-stable-video-controller">[\s\S]*?<\/script>\s*/, '');

const style = `<style id="v18-stable-video-fix">\n.hero-video{background:#dbe7ee;overflow:hidden;position:relative}\n.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.06) saturate(.96);pointer-events:none}\n@media(max-width:768px){.hero-bg-video{object-position:center center!important}}\n</style>`;
html = html.replace('</body>', `${style}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable preview built with exact iPhone-approved hero v2: ${heroBytes.length} bytes ${HERO_SHA256}`);
