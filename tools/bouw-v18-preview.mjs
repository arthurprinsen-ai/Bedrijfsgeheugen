import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];

const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const HERO_URL = 'https://videos.pexels.com/video-files/13761469/13761469-uhd_3840_2160_30fps.mp4';
const HERO_ORIGIN = 'https://videos.pexels.com';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// Proven playback architecture: direct Pexels MP4 + native HTML video.
// Before publishing, verify the CDN really exposes a streamable MP4 and byte ranges.
const head = await fetch(HERO_URL, { method: 'HEAD', redirect: 'follow', cache: 'no-store' });
if (!head.ok) throw new Error(`Hero source HEAD failed: HTTP ${head.status}`);
const contentType = (head.headers.get('content-type') || '').toLowerCase();
if (!contentType.includes('video/mp4')) throw new Error(`Hero source content-type is not video/mp4: ${contentType || 'missing'}`);
const contentLength = Number(head.headers.get('content-length') || 0);
if (contentLength && contentLength < 250000) throw new Error(`Hero source unexpectedly small: ${contentLength} bytes`);

const range = await fetch(HERO_URL, {
  method: 'GET',
  headers: { Range: 'bytes=0-1023' },
  redirect: 'follow',
  cache: 'no-store'
});
if (range.status !== 206) throw new Error(`Hero source does not support byte-range streaming: HTTP ${range.status}`);
const contentRange = range.headers.get('content-range') || '';
if (!/^bytes\s+0-1023\//i.test(contentRange)) throw new Error(`Hero source returned unexpected Content-Range: ${contentRange || 'missing'}`);
await range.arrayBuffer();

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

// Warm up DNS/TLS to the external media CDN before Safari discovers the video source.
const resourceHints = `<link rel="dns-prefetch" href="//videos.pexels.com">\n<link rel="preconnect" href="${HERO_ORIGIN}">`;
if (!html.includes(`rel="preconnect" href="${HERO_ORIGIN}"`)) {
  html = html.replace('</head>', `${resourceHints}\n</head>`);
}

const video = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="auto" aria-hidden="true">
  <source src="${HERO_URL}" type="video/mp4">
</video>`;

html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, video);
html = html.replace(/<img[^>]*id="heroBackgroundMotion"[^>]*>/, video);
html = html.replace(/<button[^>]*id="heroVideoFallback"[^>]*>[\s\S]*?<\/button>\s*/, '');
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<script id="v18-stable-video-controller">[\s\S]*?<\/script>\s*/, '');

const style = `<style id="v18-stable-video-fix">
.hero-video{background:#dbe7ee;overflow:hidden;position:relative}
.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.06) saturate(.96);pointer-events:none}
@media(max-width:768px){.hero-bg-video{object-position:center center!important}}
</style>`;
html = html.replace('</body>', `${style}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable preview built with proven Pexels playback pattern; MP4/range verified; CDN preconnected: ${HERO_URL}`);
