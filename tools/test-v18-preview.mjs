import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const HERO_PATH = 'assets/inspirational-hero-v4.mp4';

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one hero video');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero missing ${attr}`);
if (!hero.includes('poster="https://images.pexels.com/videos/35649915/free-video-35649915.jpg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600"')) fail('original proven poster must stay intact');
if (!hero.includes('/assets/inspirational-hero-v4.mp4')) fail('hero must use local drone v4 asset');
if (hero.includes('videos.pexels.com/video-files/35649915/15107522_1920_1080_30fps.mp4')) fail('control Pexels video must be replaced by drone source');
if (!html.includes('id="v18-4-video-controller"')) fail('proven original V18 controller must remain');
for (const required of ['video.muted=true','video.defaultMuted=true','video.playsInline=true','video.volume=0','DOMContentLoaded','visibilitychange','pageshow']) {
  if (!html.includes(required)) fail(`original controller behavior missing: ${required}`);
}
for (const forbidden of ['v18-stable-video-controller','playbackRate=.65','defaultPlaybackRate=.65']) {
  if (html.includes(forbidden)) fail(`unproven playback modification present: ${forbidden}`);
}

const heroStat = await stat(HERO_PATH);
if (heroStat.size < 300000 || heroStat.size > 8000000) fail(`drone hero size outside expected range: ${heroStat.size}`);
const heroBytes = await readFile(HERO_PATH);
if (heroBytes.subarray(4,8).toString('ascii') !== 'ftyp') fail('drone hero is not a valid MP4');
const heroHash = sha256(heroBytes);

if (!ffmpegPath) fail('ffmpeg-static binary unavailable for media QA');
let mediaInfo = '';
try {
  mediaInfo = execFileSync(ffmpegPath, ['-hide_banner','-i',HERO_PATH,'-f','null','-'], { encoding:'utf8', stdio:['ignore','pipe','pipe'] });
} catch (error) {
  mediaInfo = `${error.stdout || ''}\n${error.stderr || ''}`;
}
const inputInfo = mediaInfo.split('Stream mapping:')[0].split('Output #0')[0];
const videoStreams = inputInfo.match(/Stream #0:\d+.*Video:/g) || [];
const audioStreams = inputInfo.match(/Stream #0:\d+.*Audio:/g) || [];
if (videoStreams.length !== 1) fail(`expected one input video stream, got ${videoStreams.length}`);
if (audioStreams.length !== 0) fail(`expected no input audio stream, got ${audioStreams.length}`);
if (!/Video:\s*h264/i.test(inputInfo)) fail('drone hero must be H.264');
if (!/yuv420p/i.test(inputInfo)) fail('drone hero must be yuv420p');
if (!/1280x720/.test(inputInfo)) fail('drone hero must be 1280x720');
if (!/mov,mp4,m4a,3gp,3g2,mj2/i.test(inputInfo)) fail('drone hero must be MP4 container');
const durationMatch = inputInfo.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
if (!durationMatch) fail('drone hero duration missing');
const duration = Number(durationMatch[1])*3600 + Number(durationMatch[2])*60 + Number(durationMatch[3]);
if (duration < 7 || duration > 9) fail(`drone hero duration ${duration}s outside 7-9s`);

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);
const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

console.log(`V18 preview QA PASS — proven original player + drone-only media swap ${heroStat.size} bytes ${heroHash}, 14 views, ${targets.length} routes, ${hrefs.length} HTTPS anchors`);
