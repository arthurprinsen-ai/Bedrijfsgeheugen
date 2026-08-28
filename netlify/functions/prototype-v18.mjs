import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const BRANCH = 'prototype-v18-6';
const BASE = `https://raw.githubusercontent.com/arthurprinsen-ai/Bedrijfsgeheugen/${BRANCH}/v18-full`;
const FILES = [
  'chunk-00.txt','chunk-gap.txt','chunk-01.txt','chunk-02.txt',
  'chunk-03-0.txt','chunk-03-1a.txt','chunk-03-1b.txt','chunk-03-2.txt','chunk-03-3.txt','chunk-03-4.txt','chunk-03-5a0.txt','chunk-03-5a1.txt','chunk-03-5b.txt',
  'chunk-04.txt','chunk-05.txt','chunk-06.txt'
];
const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const VIDEO_TAG = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="metadata" poster="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=1600" aria-hidden="true">
  <source src="https://videos.pexels.com/video-files/5020277/5020277-hd_1920_1080_25fps.mp4" type="video/mp4">
</video>`;

const VIDEO_FIX = `
<style id="v18-10-video-fix">
.hero-video{background:#071019}
.hero-bg-video{
  display:block!important;
  opacity:1!important;
  visibility:visible!important;
  width:100%!important;
  height:100%!important;
  object-fit:cover!important;
  object-position:center center!important;
  background:#071019;
}
.hero-video:not(.v18-video-playing) .hero-bg-video{opacity:.01!important}
.hero-video.v18-video-playing .hero-bg-video,
.hero-video.video-playing .hero-bg-video,
.hero-video.video-poster.v18-video-playing .hero-bg-video{opacity:1!important}
@media(max-width:768px){.hero-bg-video{object-position:center 45%!important}}
</style>
<script id="v18-10-video-controller">
(function(){
  const video=document.getElementById('heroBackgroundVideo');
  const hero=document.querySelector('.hero-video');
  if(!video||!hero)return;
  video.muted=true;
  video.defaultMuted=true;
  video.volume=0;
  video.playsInline=true;
  video.loop=true;
  video.setAttribute('muted','');
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  const markPlaying=()=>hero.classList.add('v18-video-playing');
  const tryPlay=()=>{
    video.muted=true;
    const p=video.play();
    if(p&&typeof p.then==='function')p.then(markPlaying).catch(()=>{});
  };
  ['loadeddata','canplay','playing'].forEach(evt=>video.addEventListener(evt,markPlaying));
  if(video.readyState>=2)markPlaying();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryPlay,{once:true});
  else tryPlay();
  window.addEventListener('load',tryPlay,{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tryPlay();});
  ['touchstart','pointerdown'].forEach(evt=>window.addEventListener(evt,tryPlay,{passive:true,once:true}));
})();
</script>`;

export const handler = async () => {
  try {
    const parts = await Promise.all(FILES.map(async (file) => {
      const response = await fetch(`${BASE}/${file}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${file} HTTP ${response.status}`);
      return response.text();
    }));

    const base64 = parts.join('').replace(/\s+/g, '');
    if (base64.length !== EXPECTED_BASE64_LENGTH) {
      throw new Error(`payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
    }
    const payloadHash = sha256(base64);
    if (payloadHash !== EXPECTED_BASE64_SHA256) {
      throw new Error(`payload integrity mismatch ${payloadHash}`);
    }

    let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
    const htmlHash = sha256(html);
    if (htmlHash !== EXPECTED_HTML_SHA256) {
      throw new Error(`html integrity mismatch ${htmlHash}`);
    }
    if (!html.includes('id="view-home"') || !html.includes('id="view-product"')) {
      throw new Error('prototype validation failed');
    }

    html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, VIDEO_TAG);
    html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
    if (!html.includes('id="v18-10-video-controller"')) {
      html = html.replace('</body>', `${VIDEO_FIX}\n</body>`);
    }
    html = html.replace('<head>', '<head><base href="/">');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Prototype-Version': 'v18-human-hero'
      },
      body: html
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      body: `Prototype kon niet laden: ${error?.message || error}`
    };
  }
};
