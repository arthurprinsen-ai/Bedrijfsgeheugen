import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const OPENART_SOURCE = 'https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4';
const HERO_VIDEO_URL = '/assets/hero-openart-v1.mp4';
const HERO_VIDEO_FILE = 'assets/hero-openart-v1.mp4';
const HERO_POSTER_URL = '/assets/hero-openart-v1.jpg';
const HERO_POSTER_FILE = 'assets/hero-openart-v1.jpg';
const HERO_MANIFEST = 'assets/hero-openart-v1.txt';
const RAW_FILE = 'assets/.hero-openart-v1-raw.mp4';
const LEGACY_PEOPLE_IMAGE = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const sha256 = value => createHash('sha256').update(value).digest('hex');

await mkdir('assets', { recursive: true });

const sourceResponse = await fetch(OPENART_SOURCE, { cache: 'no-store' });
if (!sourceResponse.ok) throw new Error(`OpenArt source download failed: HTTP ${sourceResponse.status}`);
const raw = Buffer.from(await sourceResponse.arrayBuffer());
if (raw.length < 500000) throw new Error(`OpenArt source unexpectedly small: ${raw.length}`);
await writeFile(RAW_FILE, raw);

try {
  execFileSync(ffmpegPath, [
    '-y','-hide_banner','-loglevel','error',
    '-i',RAW_FILE,
    '-an',
    '-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
    '-c:v','libx264','-profile:v','high','-level:v','4.0','-pix_fmt','yuv420p',
    '-preset','medium','-crf','23','-maxrate','4500k','-bufsize','9000k',
    '-movflags','+faststart',
    HERO_VIDEO_FILE
  ], { stdio: 'pipe' });

  execFileSync(ffmpegPath, [
    '-y','-hide_banner','-loglevel','error',
    '-ss','0.2','-i',HERO_VIDEO_FILE,
    '-frames:v','1','-q:v','3',
    HERO_POSTER_FILE
  ], { stdio: 'pipe' });
} finally {
  await rm(RAW_FILE, { force: true });
}

await writeFile(HERO_MANIFEST,
  `source=${OPENART_SOURCE}\ntarget=1920x1080@30fps\ncodec=h264\npix_fmt=yuv420p\naudio=none\nfaststart=true\nvideo=${HERO_VIDEO_URL}\nposter=${HERO_POSTER_URL}\n`,
  'utf8'
);

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);
if (!html.includes('id="v18-4-video-controller"')) throw new Error('Canonical proven V18 controller missing');

const heroMatch = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/);
if (!heroMatch) throw new Error('Canonical hero video element missing');
let hero = heroMatch[0];
hero = hero.replace(/poster="[^"]*"/, `poster="${HERO_POSTER_URL}"`);
hero = hero.replace(/<source\s+src="[^"]+"\s+type="video\/mp4"\s*\/?>/, `<source src="${HERO_VIDEO_URL}" type="video/mp4">`);
if (!hero.includes(HERO_VIDEO_URL) || !hero.includes(HERO_POSTER_URL)) throw new Error('OpenArt hero media swap failed');
html = html.replace(heroMatch[0], hero);

html = html.split(LEGACY_PEOPLE_IMAGE).join(HERO_POSTER_URL);
if (html.includes(LEGACY_PEOPLE_IMAGE)) throw new Error('Legacy people hero fallback still present');

const diagnostics = `<style id="v18-hero-hard-reset">
.hero-video{background:#dbe7ee!important;background-image:none!important;}
.hero-video::before,.hero-video::after{content:none!important;display:none!important;background:none!important;background-image:none!important;}
#heroBackgroundVideo{display:block!important;opacity:1!important;visibility:visible!important;}
#v18VideoDebug{display:none;position:fixed;z-index:2147483647;left:8px;right:8px;bottom:8px;max-height:42vh;overflow:auto;background:rgba(0,0,0,.88);color:#fff;padding:10px 12px;border-radius:10px;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;}
</style>
<div id="v18VideoDebug" aria-live="polite"></div>
<script id="v18-video-diagnostics">
(function(){
  const video=document.getElementById('heroBackgroundVideo');
  const box=document.getElementById('v18VideoDebug');
  if(!video||!box)return;
  const debug=new URLSearchParams(location.search).get('video-debug')==='1';
  if(!debug)return;
  box.style.display='block';
  const events=[];
  const snapshot=(label)=>{
    const e=video.error;
    const data={label,t:Date.now(),currentSrc:video.currentSrc,paused:video.paused,ended:video.ended,currentTime:Number(video.currentTime||0).toFixed(3),readyState:video.readyState,networkState:video.networkState,videoWidth:video.videoWidth,videoHeight:video.videoHeight,errorCode:e?e.code:0,errorMessage:e&&e.message?e.message:'',muted:video.muted,playsInline:video.playsInline};
    events.push(data);
    while(events.length>12)events.shift();
    box.textContent=events.map(x=>JSON.stringify(x)).join('\n');
  };
  ['loadstart','loadedmetadata','loadeddata','canplay','canplaythrough','play','playing','waiting','stalled','suspend','pause','error','abort','emptied'].forEach(evt=>video.addEventListener(evt,()=>snapshot(evt)));
  setInterval(()=>snapshot('tick'),1500);
  snapshot('init');
})();
</script>`;

html = html.replace('</body>', `${diagnostics}\n</body>`);
await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable preview built with optimized OpenArt hero ${HERO_VIDEO_URL}; canonical controller preserved`);
