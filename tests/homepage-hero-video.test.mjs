import { readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const manifest = JSON.parse(await readFile('assets/openart-hero-production.json', 'utf8'));
const fail = message => { throw new Error(`Homepage hero video regression: ${message}`); };
const expectedSource = '/assets/openart-hero-iphone-safe-v1.mp4';
const expectedSha = 'a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd';

if (manifest.derivative_sha256 !== expectedSha) fail('accepted derivative hash changed');
if (manifest.derivative_url !== expectedSource) fail('manifest derivative URL changed');

// Physical-device acceptance is content-addressed. A PASS may never be inherited
// from an earlier hero: it is valid only for the exact derivative hash tested.
if (manifest.physical_iphone_runtime === 'PASS') {
  if (manifest.physical_iphone_runtime_derivative_sha256 !== manifest.derivative_sha256) {
    fail('physical iPhone PASS is not bound to the exact derivative hash');
  }
  if (!manifest.physical_iphone_runtime_evidence) {
    fail('physical iPhone PASS is missing explicit acceptance evidence');
  }
} else if (manifest.physical_iphone_runtime !== 'PENDING') {
  fail(`invalid physical iPhone runtime status: ${manifest.physical_iphone_runtime}`);
}

const matches = [...html.matchAll(/<video\b[^>]*class="hero-product-video"[^>]*>[\s\S]*?<\/video>/gi)];
if (matches.length !== 1) fail(`expected exactly one hero-product-video, found ${matches.length}`);
const video = matches[0][0];
for (const attr of ['autoplay', 'muted', 'playsinline', 'loop']) {
  if (!new RegExp(`\\b${attr}\\b`, 'i').test(video)) fail(`video missing ${attr}`);
}
if (!video.includes(`src="${expectedSource}"`)) fail('video does not use exact accepted local derivative');
if (/cdn\.openart\.ai/i.test(video)) fail('production hero video must not depend on OpenArt CDN');
if (!/aria-hidden="true"/i.test(video)) fail('decorative video must be hidden from accessibility tree');
if (!html.includes('class="hero-media-frame"')) fail('responsive hero media frame missing');
if (!html.includes('.hero-product-video')) fail('hero video CSS contract missing');
if (!html.includes('@media(max-width:980px)')) fail('existing responsive breakpoint missing');

console.log(`Homepage hero video contract PASS: ${expectedSha} (${manifest.physical_iphone_runtime})`);
