import { readFile, writeFile, unlink } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

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
const HERO_SOURCE_PATH = 'assets/inspirational-hero-v5-source.mp4';
const HERO_PATH = 'assets/inspirational-hero-v5.mp4';
const HERO_POSTER_PATH = 'assets/inspirational-hero-v5-poster.jpg';
const HERO_MANIFEST_PATH = 'assets/inspirational-hero-v5.integrity.txt';
const sha256 = value => createHash('sha256').update(value).digest('hex');

// V5: build one lightweight Safari-safe, cache-busted, same-origin hero asset.
const heroResponse = await fetch(HERO_SOURCE_URL, { cache: 'no-store' });
if (!heroResponse.ok) throw new Error(`Hero v5 source download failed: HTTP ${heroResponse.status}`);
const sourceBytes = Buffer.from(await heroResponse.arrayBuffer());
if (sourceBytes.length < 1000000) throw new Error(`Hero v5 source unexpectedly small: ${sourceBytes.length} bytes`);
if (sourceBytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hero v5 source is not a valid MP4 container');
await writeFile(HERO_SOURCE_PATH, sourceBytes);

if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary path');
const { stderr: ffmpegLog } = await execFileAsync(ffmpegPath, [
  '-y','-i',HERO_SOURCE_PATH,
  '-map','0:v:0','-an',
  '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black',
  '-c:v','libx264','-profile:v','high','-level:v','4.0','-pix_fmt','yuv420p',
  '-preset','medium','-crf','24','-maxrate','2500k','-bufsize','5000k','-movflags','+faststart',
  HERO_PATH
], { maxBuffer: 20 * 1024 * 1024 });
await execFileAsync(ffmpegPath, [
  '-y','-ss','0.25','-i',HERO_PATH,'-frames:v','1','-q:v','3',HERO_POSTER_PATH
], { maxBuffer: 20 * 1024 * 1024 });

const heroBytes = await readFile(HERO_PATH);
if (heroBytes.length < 300000 || heroBytes.length > 8000000) throw new Error(`Hero v5 web asset size outside expected range: ${heroBytes.length} bytes`);
if (heroBytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw new Error('Hero v5 output is not a valid MP4 container');
if (!/Video:\s*h264/i.test(ffmpegLog)) throw new Error('Hero v5 transcode did not report H.264 output');
if (!/yuv420p/i.test(ffmpegLog)) throw new Error('Hero v5 transcode did not report yuv420p output');
const posterBytes = await readFile(HERO_POSTER_PATH);
if (posterBytes.length < 10000) throw new Error(`Hero v5 poster unexpectedly small: ${posterBytes.length} bytes`);
const heroHash = sha256(heroBytes);
await writeFile(HERO_MANIFEST_PATH,
  `bytes=${heroBytes.length}\nsha256=${heroHash}\ncodec=h264\npixel_format=yuv420p\naudio=none\nresolution=1280x720\nposter=${HERO_POSTER_PATH}\nsource=${HERO_SOURCE_URL}\n`,
  'utf8'
);
await unlink(HERO_SOURCE_PATH).catch(() => {});

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

const video = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="metadata" poster="/assets/inspirational-hero-v5-poster.jpg" aria-hidden="true">
  <source src="/assets/inspirational-hero-v5.mp4" type="video/mp4">
</video>
<button id="heroVideoFallback" type="button" class="hero-video-fallback" aria-label="Video afspelen">Video afspelen</button>`;
html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, video);
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');

const videoFix = `<style id="v18-stable-video-fix">
.hero-video{background:#dbe7ee;overflow:hidden;position:relative}
.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.08) saturate(.94)}
.hero-video-fallback{display:none;position:absolute;z-index:8;right:18px;bottom:18px;border:0;border-radius:999px;padding:11px 16px;background:rgba(7,24,50,.84);color:#fff;font:600 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 8px 30px rgba(0,0,0,.18)}
.hero-video-fallback.is-visible{display:block}
#heroVideoDebug{display:none;position:fixed;z-index:99999;left:8px;right:8px;bottom:8px;max-height:46vh;overflow:auto;margin:0;padding:10px;border-radius:10px;background:rgba(0,0,0,.88);color:#d9ffd9;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word}
body.v18-video-debug #heroVideoDebug{display:block}
@media(max-width:768px){.hero-bg-video{object-position:center center!important}.hero-video-fallback{right:12px;bottom:12px}}
</style>
<script id="v18-stable-video-controller">
(function(){
  const video=document.getElementById('heroBackgroundVideo');
  const fallback=document.getElementById('heroVideoFallback');
  if(!video)return;
  const params=new URLSearchParams(location.search);
  const debug=params.get('debugVideo')==='1';
  let debugEl=null, playing=false, lastReject='';
  if(debug){ document.body.classList.add('v18-video-debug'); debugEl=document.createElement('pre'); debugEl.id='heroVideoDebug'; document.body.appendChild(debugEl); }
  const snapshot=(event)=>({
    event, time:new Date().toISOString(), currentSrc:video.currentSrc, readyState:video.readyState,
    networkState:video.networkState, paused:video.paused, ended:video.ended, muted:video.muted,
    playsInline:video.playsInline, videoWidth:video.videoWidth, videoHeight:video.videoHeight,
    currentTime:Number(video.currentTime||0).toFixed(2), playbackRate:video.playbackRate,
    error:video.error?{code:video.error.code,message:video.error.message}:null,
    playReject:lastReject, canPlayMp4:video.canPlayType('video/mp4; codecs="avc1.640028"'),
    visibility:document.visibilityState, ua:navigator.userAgent
  });
  const report=(event)=>{ const data=snapshot(event); try{sessionStorage.setItem('v18VideoDebug',JSON.stringify(data));}catch(e){} if(debugEl) debugEl.textContent=JSON.stringify(data,null,2); console.info('[V18 video]',data); };
  const prep=()=>{ video.muted=true; video.defaultMuted=true; video.volume=0; video.playsInline=true; video.loop=true; video.setAttribute('muted',''); video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline',''); };
  const attempt=async(reason)=>{ prep(); try{ const p=video.play(); if(p&&typeof p.then==='function') await p; lastReject=''; report('play-ok:'+reason); }catch(err){ lastReject=(err&&err.name?err.name+': ':'')+(err&&err.message?err.message:String(err)); report('play-reject:'+reason); } };
  const markPlaying=()=>{ playing=true; fallback?.classList.remove('is-visible'); if(Math.abs(video.playbackRate-.65)>.001){ try{video.playbackRate=.65;video.defaultPlaybackRate=.65;}catch(e){} } report('playing'); };
  prep();
  ['loadedmetadata','loadeddata','canplay','waiting','stalled','suspend','error','abort','emptied'].forEach(evt=>video.addEventListener(evt,()=>report(evt)));
  video.addEventListener('playing',markPlaying);
  video.addEventListener('pause',()=>report('pause'));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>attempt('domcontentloaded'),{once:true}); else attempt('immediate');
  window.addEventListener('load',()=>attempt('load'),{once:true});
  window.addEventListener('pageshow',()=>attempt('pageshow'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)attempt('visibility');});
  setTimeout(()=>{ if(!playing || video.paused){ fallback?.classList.add('is-visible'); report('fallback-visible'); } },2800);
  fallback?.addEventListener('click',async()=>{ await attempt('user-tap'); if(!video.paused) fallback.classList.remove('is-visible'); });
  ['touchstart','pointerdown'].forEach(evt=>window.addEventListener(evt,()=>{ if(video.paused) attempt(evt); },{passive:true,once:true}));
})();
</script>`;
html = html.replace('</body>', `${videoFix}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable static preview built: ${Buffer.byteLength(html)} bytes; resilient hero-v5 ${heroBytes.length} bytes ${heroHash}; poster ${posterBytes.length} bytes`);
