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
const PEXELS_DOWNLOAD_URL = 'https://www.pexels.com/download/video/8783011/';
const EXPECTED_SOURCE_SUFFIX = '/8783011/8783011-hd_1920_1080_30fps.mp4';
const DRONE_POSTER = 'https://images.pexels.com/videos/36182314/aerial-architecture-building-business-36182314.jpeg?auto=compress&dpr=1&h=750&w=1260';
const LEGACY_PEOPLE_IMAGE = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const HERO_SOURCE_MANIFEST = 'assets/hero-pexels-source.txt';
const sha256 = value => createHash('sha256').update(value).digest('hex');

const sourceResponse = await fetch(PEXELS_DOWNLOAD_URL, {
  method: 'GET',
  redirect: 'follow',
  headers: { Range: 'bytes=0-1023' },
  cache: 'no-store'
});
if (!(sourceResponse.ok || sourceResponse.status === 206)) {
  throw new Error(`Pexels drone source resolution failed: HTTP ${sourceResponse.status}`);
}
const resolvedDroneSource = sourceResponse.url;
const contentType = (sourceResponse.headers.get('content-type') || '').toLowerCase();
if (!resolvedDroneSource.startsWith('https://videos.pexels.com/')) {
  throw new Error(`Pexels download did not resolve to videos.pexels.com: ${resolvedDroneSource}`);
}
if (!resolvedDroneSource.includes(EXPECTED_SOURCE_SUFFIX)) {
  throw new Error(`Pexels source no longer resolves to required 1920x1080@30fps delivery: ${resolvedDroneSource}`);
}
if (!contentType.includes('video/mp4') && !contentType.includes('application/octet-stream')) {
  throw new Error(`Pexels resolved source returned unexpected content-type: ${contentType}`);
}
await sourceResponse.arrayBuffer();
await writeFile(HERO_SOURCE_MANIFEST,
  `download=${PEXELS_DOWNLOAD_URL}\nresolved=${resolvedDroneSource}\nstatus=${sourceResponse.status}\ncontent_type=${contentType}\n`,
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
hero = hero.replace(/poster="[^"]*"/, `poster="${DRONE_POSTER}"`);
hero = hero.replace(/<source\s+src="[^"]+"\s+type="video\/mp4"\s*\/?>/, `<source src="${resolvedDroneSource}" type="video/mp4">`);
if (!hero.includes(resolvedDroneSource) || !hero.includes(DRONE_POSTER)) throw new Error('Hero media swap failed');
html = html.replace(heroMatch[0], hero);

html = html.split(LEGACY_PEOPLE_IMAGE).join(DRONE_POSTER);
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
    const data={
      label,
      t:Date.now(),
      currentSrc:video.currentSrc,
      paused:video.paused,
      ended:video.ended,
      currentTime:Number(video.currentTime||0).toFixed(3),
      readyState:video.readyState,
      networkState:video.networkState,
      videoWidth:video.videoWidth,
      videoHeight:video.videoHeight,
      errorCode:e?e.code:0,
      errorMessage:e&&e.message?e.message:'',
      muted:video.muted,
      playsInline:video.playsInline
    };
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
console.log(`V18 stable preview built: canonical controller, hard-reset hero fallback, iPhone diagnostics, official HD 1920x1080@30fps Pexels source: ${resolvedDroneSource}`);
