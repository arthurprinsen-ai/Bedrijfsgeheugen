import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.ok(existsSync('tools/bouw-v18-production.mjs'), 'production V18 builder must exist');
const builder = readFileSync('tools/bouw-v18-production.mjs','utf8');
assert.match(builder, /v18-full\/chunk-00\.txt/, 'builder must use pinned V18 payload');
assert.match(builder, /openart-hero-iphone-safe-v1\.mp4/, 'builder must use accepted local iPhone-safe hero media');
assert.doesNotMatch(builder, /cdn\.openart\.ai|fetch\(OPENART_SOURCE|ffmpeg-static/, 'production build must not depend on external hero download/transcoding');
assert.match(builder, /writeFile\('index\.html'/, 'builder must materialize the production homepage as index.html');
assert.match(builder, /prototype-v18-stable\.html/, 'builder must retain a stable comparison copy');

const netlify = readFileSync('netlify.toml','utf8');
assert.match(netlify, /node tools\/bouw-v18-production\.mjs/, 'Netlify build must run the V18 production builder');

console.log('V18 production promotion contract passed');
