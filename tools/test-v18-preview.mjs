import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const CONTROL_SOURCE = 'https://videos.pexels.com/video-files/35649915/15107522_1920_1080_30fps.mp4';
const LOCAL_SOURCE = '/assets/inspirational-hero-v4.mp4';
const HERO_PATH = 'assets/inspirational-hero-v4.mp4';
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const canonicalBase64 = (await Promise.all(FILES.map(path => readFile(path, 'utf8')))).join('').replace(/\s+/g, '');
const canonicalHtml = gunzipSync(Buffer.from(canonicalBase64, 'base64')).toString('utf8');

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');
if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

const canonicalHero = canonicalHtml.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
const currentHero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
if (!canonicalHero) fail('canonical hero video missing');
if (!currentHero) fail('current hero video missing');
const expectedHero = canonicalHero.replace(CONTROL_SOURCE, LOCAL_SOURCE);
if (currentHero !== expectedHero) fail('hero markup differs from canonical V18 beyond the allowed src swap');

const canonicalController = canonicalHtml.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
const currentController = html.match(/<script id="v18-4-video-controller">[\s\S]*?<\/script>/)?.[0] || '';
if (!canonicalController) fail('canonical V18 controller missing');
if (currentController !== canonicalController) fail('proven V18 controller changed');
if (html.includes('v18-stable-video-controller')) fail('unproven alternate playback controller present');
if (html.includes('playbackRate=.65') || html.includes('defaultPlaybackRate=.65')) fail('unproven playback-rate modification present');

const canonicalWithoutSource = canonicalHtml.replace(CONTROL_SOURCE, LOCAL_SOURCE);
if (html !== canonicalWithoutSource) fail('preview HTML differs from canonical V18 beyond the single hero src swap');

const heroStat = await stat(HERO_PATH);
if (heroStat.size < 300000 || heroStat.size > 8000000) fail(`drone hero size outside expected range: ${heroStat.size}`);
const heroBytes = await readFile(HERO_PATH);
if (heroBytes.subarray(4,8).toString('ascii') !== 'ftyp') fail('drone hero is not a valid MP4');
const heroHash = sha256(heroBytes);

if (!ffmpegPath) fail('ffmpeg-static binary unavailable for media QA');
const probe = spawnSync(ffmpegPath, ['-hide_banner','-i',HERO_PATH,'-f','null','-'], { encoding:'utf8' });
const mediaInfo = `${probe.stdout || ''}\n${probe.stderr || ''}`;
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

console.log(`V18 preview QA PASS — canonical V18 byte-identical except drone src; ${heroStat.size} bytes ${heroHash}, 14 views, ${targets.length} routes, ${hrefs.length} HTTPS anchors`);
