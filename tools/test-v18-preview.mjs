import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const html = await readFile('prototype-v18-stable.html', 'utf8');
const indexHtml = await readFile('index.html', 'utf8');
const fail = message => { throw new Error(`V18 preview regression: ${message}`); };
const count = (text, re) => (text.match(re) || []).length;
const sha256 = value => createHash('sha256').update(value).digest('hex');

if (!indexHtml.includes('/prototype-v18-stable.html')) fail('preview root must route to prototype-v18-stable.html');
if (indexHtml.includes('/prototype-v18-6.html')) fail('preview root still routes to obsolete simplified V18.6');

if (count(html, /id="view-[^"]+"/g) !== 14) fail('expected exactly 14 views');
if (!html.includes('id="v18MobileDrawer"')) fail('mobile drawer missing');

const views = new Set([...html.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]));
const targets = [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]);
for (const target of targets) if (!views.has(target)) fail(`missing data-view target: ${target}`);

if (count(html, /id="heroBackgroundVideo"/g) !== 1) fail('expected exactly one hero video');
const hero = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/)?.[0] || '';
for (const attr of ['autoplay','muted','playsinline','loop']) if (!new RegExp(`\\b${attr}\\b`).test(hero)) fail(`hero video missing ${attr}`);
if (!hero.includes('/assets/inspirational-hero-v4.mp4')) fail('hero video must use Safari-safe same-origin v4 MP4');
if (!html.includes('video.playbackRate=.65')) fail('hero v4 must use the approved slower cinematic playback rate');

for (const forbidden of ['DecompressionStream','pako','v18-full/chunk','atob(']) if (html.includes(forbidden)) fail(`runtime loader token present: ${forbidden}`);

const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map(m => m[1].trim());
const badHrefs = hrefs.filter(href => !href.startsWith('https://'));
if (badHrefs.length) fail(`non-HTTPS anchor hrefs: ${badHrefs.slice(0,5).join(', ')}`);

const VIDEO_PATH = 'assets/inspirational-hero-v4.mp4';
const videoStat = await stat(VIDEO_PATH);
if (videoStat.size < 100000) fail(`hero v4 unexpectedly small: ${videoStat.size} bytes`);
const videoBytes = await readFile(VIDEO_PATH);
if (videoBytes.subarray(4, 8).toString('ascii') !== 'ftyp') fail('hero v4 is not a valid MP4 container');
const videoHash = sha256(videoBytes);
if (!/^[a-f0-9]{64}$/.test(videoHash)) fail('hero v4 hash invalid');

if (!ffmpegPath) fail('ffmpeg-static did not provide a verification binary path');
const mediaCheck = spawnSync(ffmpegPath, ['-hide_banner','-i',VIDEO_PATH,'-f','null','-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
if (mediaCheck.error) fail(`ffmpeg media verification failed to start: ${mediaCheck.error.message}`);
if (mediaCheck.status !== 0) fail(`ffmpeg media verification failed: ${(mediaCheck.stderr || '').slice(-1200)}`);
const mediaInfo = mediaCheck.stderr || '';
const videoLines = mediaInfo.split('\n').filter(line => /Stream #.*Video:/.test(line));
const audioLines = mediaInfo.split('\n').filter(line => /Stream #.*Audio:/.test(line));
if (videoLines.length !== 1) fail(`expected exactly one video stream, found ${videoLines.length}`);
if (audioLines.length !== 0) fail(`hero v4 must contain no audio streams, found ${audioLines.length}`);
const videoLine = videoLines[0];
if (!/Video:\s*h264\b/.test(videoLine)) fail(`hero v4 is not H.264: ${videoLine.trim()}`);
if (!/\byuv420p\b/.test(videoLine)) fail(`hero v4 is not yuv420p: ${videoLine.trim()}`);
if (!/\b1280x720\b/.test(videoLine)) fail(`hero v4 is not 1280x720: ${videoLine.trim()}`);
if (!/Input #0, .*mp4/i.test(mediaInfo)) fail('hero v4 input container was not recognized as MP4');
const durationMatch = mediaInfo.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
if (!durationMatch) fail('hero v4 duration missing from ffmpeg inspection');
const duration = Number(durationMatch[1])*3600 + Number(durationMatch[2])*60 + Number(durationMatch[3]);
if (!(duration > 7 && duration < 9)) fail(`hero v4 duration ${duration}s outside expected source range`);

console.log(`V18 preview QA PASS — stable root, 14 views, ${targets.length} routes, Safari-safe hero-v4 ${videoStat.size} bytes ${videoHash}, h264/yuv420p/1280x720/no-audio, ${hrefs.length} HTTPS anchors`);
