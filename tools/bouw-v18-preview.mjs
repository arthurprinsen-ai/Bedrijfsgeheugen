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
const HERO_SOURCE_URL = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-1e5fd189-ae01-9b05-b8b8-b0d05a1f7f52_1787916876752_794b55dd.mp4';
const HERO_PATH = 'assets/inspirational-hero-v3.mp4';
const HERO_MANIFEST_PATH = 'assets/inspirational-hero-v3.integrity.txt';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// V3: download the approved generated drone clip at BUILD time only.
// The deployed browser never depends on OpenArt/CDN: Netlify serves one same-origin static MP4.
const heroResponse = await fetch(HERO_SOURCE_URL, { cache: 'no-store' });
if (!heroResponse.ok) throw new Error(`Hero v3 download failed: HTTP ${heroResponse.status}`);
const heroBytes = Buffer.from(await heroResponse.arrayBuffer());
if (heroBytes.length < 100000) throw new Error(`Hero v3 unexpectedly small: ${heroBytes.length} bytes`);
if (heroBytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hero v3 is not a valid MP4 container');
const heroHash = sha256(heroBytes);
await writeFile(HERO_PATH, heroBytes);
await writeFile(HERO_MANIFEST_PATH, `bytes=${heroBytes.length}\nsha256=${heroHash}\nsource=${HERO_SOURCE_URL}\n`, 'utf8');

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);

let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

const video = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="metadata" aria-hidden="true">
  <source src="/assets/inspirational-hero-v3.mp4" type="video/mp4">
</video>`;

html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, video);
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');

const videoFix = `<style id="v18-stable-video-fix">
.hero-video{background:#dbe7ee;overflow:hidden}
.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.08) saturate(.94)}
@media(max-width:768px){.hero-bg-video{object-position:center center!important}}
</style>
<script id="v18-stable-video-controller">
(function(){
  const video=document.getElementById('heroBackgroundVideo');
  if(!video)return;
  const prep=()=>{
    video.muted=true; video.defaultMuted=true; video.volume=0; video.playsInline=true; video.loop=true;
    video.playbackRate=.65; video.defaultPlaybackRate=.65;
    video.setAttribute('muted',''); video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline','');
  };
  const play=()=>{ prep(); const p=video.play(); if(p&&typeof p.catch==='function')p.catch(()=>{}); };
  prep();
  video.addEventListener('loadedmetadata',prep);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',play,{once:true}); else play();
  window.addEventListener('load',play,{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)play();});
  window.addEventListener('pageshow',play);
  ['touchstart','pointerdown'].forEach(evt=>window.addEventListener(evt,play,{passive:true,once:true}));
})();
</script>`;

html = html.replace('</body>', `${videoFix}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable static preview built: ${Buffer.byteLength(html)} bytes; hero-v3 ${heroBytes.length} bytes ${heroHash}`);
